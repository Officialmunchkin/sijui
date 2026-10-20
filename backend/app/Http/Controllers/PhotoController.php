<?php

namespace App\Http\Controllers;

use App\Models\Album;
use App\Models\MediaVisibility;
use App\Models\Member;
use App\Models\Photo;
use App\Services\WorkerClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Photos: the local `photos` table is the source of truth for the LIST
 * (album assignment, trash state). The actual file BYTES live in R2 and are
 * proxied through the Cloudflare Worker (App\Services\WorkerClient).
 *
 * This split means a fresh database = an empty vault (0 photos) regardless of
 * what bytes still sit in the bucket, and trashing/renaming is instant and
 * local. Uploads stream browser -> Laravel -> Worker -> R2 and record a local
 * meta row; permanent deletes purge both the R2 object and the local row.
 *
 * There is NO "UNSORTED" concept. The only system album is TRASH.
 */
class PhotoController extends Controller
{
    public function __construct(protected WorkerClient $worker)
    {
    }

    /**
     * GET /api/photos
     *
     * Lists non-trashed photos from the local table (newest first). `tagged`
     * is a JSON array of member ids; `size` is bytes.
     *
     * SELECTIVE SHARING ("Who can see?"):
     *   A photo with NO rows in media_visibility is public to the whole
     *   family — that is the default and it keeps every existing photo
     *   working untouched. Rows only exist to NARROW it:
     *
     *     id NOT IN (SELECT media_id FROM media_visibility)
     *       OR id IN (SELECT media_id FROM media_visibility
     *                 WHERE allowed_viewer_user_id = :viewer)
     *
     * `visibleTo` is echoed back (as member ids, like `tagged`) so the
     * frontend can show the eye icon. It is only ever returned for photos the
     * caller is allowed to see, so it never leaks the existence of a restricted
     * photo to someone excluded from it.
     *
     * Guests and unauthenticated callers see public photos only: a guest is
     * ephemeral and cannot be named as an allowed viewer, so a restricted
     * photo has no way to reach one.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var Member|null $actor */
        $actor = $request->attributes->get('famvault_member');

        $viewerId = ($actor && ! $actor->is_guest) ? $actor->id : null;

        $query = Photo::query()->where('trashed', false);

        if (($album = $request->query('album')) && strtoupper($album) !== 'ALL') {
            $query->where('album', strtoupper($album));
        }

        $query->where(function ($q) use ($viewerId) {
            // Public leg: no visibility rows at all.
            $q->whereNotExists(function ($sub) {
                $sub->selectRaw('1')
                    ->from('media_visibility')
                    ->whereColumn('media_visibility.media_id', 'photos.id');
            });

            // Restricted leg: named in the allow-list. Skipped entirely for
            // guests/unauthenticated, who have no identity to match against.
            if ($viewerId !== null) {
                $q->orWhereExists(function ($sub) use ($viewerId) {
                    $sub->selectRaw('1')
                        ->from('media_visibility')
                        ->whereColumn('media_visibility.media_id', 'photos.id')
                        ->where('media_visibility.allowed_viewer_user_id', $viewerId);
                });
            }
        });

        $photos = $query->orderByDesc('id')->get();

        $visible = $this->visibilityMap($photos->pluck('id')->all());

        $items = $photos
            ->map(fn (Photo $p) => $p->toClientArray() + ['visibleTo' => $visible[$p->id] ?? []])
            ->values();

        return response()->json(['photos' => $items]);
    }

    /**
     * GET /api/photos/trash — ADMIN ONLY. Trashed items (newest trashed
     * first) with the metadata the ADMIN/TRASH view needs: originalAlbum,
     * deletedBy, trashedAt, size.
     */
    public function trash(Request $request): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if (! $actor || $actor->is_guest || ! $actor->is_admin) {
            return response()->json(['error' => 'ADMIN ONLY'], 403);
        }

        $items = Photo::query()
            ->where('trashed', true)
            ->orderByDesc('trashed_at')
            ->get()
            ->map(fn (Photo $p) => $p->toClientArray() + [
                'originalAlbum' => $p->original_album,
                'deletedBy' => $p->deleted_by,
                'trashedAt' => $p->trashed_at?->getTimestamp() * 1000,
            ]);

        return response()->json(['photos' => $items]);
    }

    /**
     * POST /api/photos/upload
     *
     * Streams the multipart file through to the Worker (R2) and records a
     * local meta row. Members only. Defaults to the first album when none is
     * given (there is no UNSORTED bucket anymore).
     */
    public function upload(Request $request): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if ($actor->is_guest) {
            return response()->json(['error' => 'GUESTS CANNOT UPLOAD'], 403);
        }

        $request->validate([
            'file' => 'required|file|max:204800', // 200MB cap
            'caption' => 'nullable|string|max:300',
            'album' => 'nullable|string|max:60',
            'tagged' => 'nullable|string|max:500',
            'allowed_viewers' => 'nullable',      // array of member ids, or CSV
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'mp4', 'webm', 'mov', 'm4v'];
        if (! in_array($ext, $allowed, true)) {
            return response()->json(['error' => 'unsupported file type: '.$ext], 415);
        }

        $album = strtoupper(trim((string) $request->input('album', '')));
        if ($album === '' || ! Album::query()->where('name', $album)->exists()) {
            $album = Album::query()->orderBy('id')->value('name') ?? 'SUMMER 24';
        }

        $tagged = array_values(array_filter(array_map('trim', explode(',', (string) $request->input('tagged', '')))));
        if (! in_array($actor->id, $tagged, true)) {
            $tagged[] = $actor->id;
        }

        try {
            $result = $this->worker->upload(
                $file,
                strtoupper(trim((string) $request->input('caption', 'NEW MEMORY'))),
                $album,
                $actor->id,
                $tagged,
            );
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }

        $photo = $result['photo'] ?? $result;

        $id = $photo['id'] ?? ('p'.uniqid());

        Photo::query()->updateOrCreate(
            ['id' => $id],
            [
                'key' => $photo['key'] ?? null,
                'type' => $photo['type'] ?? (str_starts_with($file->getMimeType(), 'video/') ? 'video' : 'image'),
                'album' => $album,
                'uploaded_by' => $actor->id,
                'tagged' => $tagged,
                'caption' => $photo['caption'] ?? strtoupper(trim((string) $request->input('caption', 'NEW MEMORY'))),
                'photo_date' => now()->toDateString(),
                'likes' => $photo['likes'] ?? 0,
                'size' => $photo['size'] ?? $file->getSize(),
                'file_name' => $file->getClientOriginalName(),
                'trashed' => false,
                'original_album' => null,
                'trashed_at' => null,
            ],
        );

        // SELECTIVE SHARING: "All Family" sends nothing (or everyone), which
        // leaves zero rows — the public default. Picking individuals writes an
        // allow-list, which is what narrows the photo. The uploader is always
        // included so they never lock themselves out of their own memory.
        $allowed = $this->normalizeViewers($request->input('allowed_viewers'));

        if ($allowed !== []) {
            $this->writeVisibility($id, array_values(array_unique(array_merge($allowed, [$actor->id]))));
        }

        return response()->json(['ok' => true, 'photo' => Photo::query()->find($id)?->toClientArray() + ['visibleTo' => $allowed]], 201);
    }

    /**
     * PUT /api/photos/{id}/visibility — { allowed_viewers: [...] }
     *
     * Change your mind later. Empty list = back to public (rows deleted,
     * which is exactly what "public" means here). Only the person who
     * uploaded the photo may change this — not even the admin, consistent
     * with the admin being bound by the same sharing rules as everyone else.
     */
    public function setVisibility(Request $request, string $id): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if ($actor->is_guest) {
            return response()->json(['error' => 'GUESTS CANNOT SHARE'], 403);
        }

        $photo = Photo::query()->find($id);

        if (! $photo) {
            return response()->json(['error' => 'PHOTO NOT FOUND'], 404);
        }

        if ($photo->uploaded_by !== $actor->id) {
            return response()->json(['error' => 'ONLY THE UPLOADER CAN CHANGE WHO SEES THIS'], 403);
        }

        $allowed = $this->normalizeViewers($request->input('allowed_viewers'));

        // The uploader is always kept in their own allow-list, otherwise
        // sharing a photo with a subset would hide it from its author.
        $final = $allowed === [] ? [] : array_values(array_unique(array_merge($allowed, [$actor->id])));

        $this->writeVisibility($id, $final);

        return response()->json(['ok' => true, 'visibleTo' => $final]);
    }

    /**
     * POST /api/photos/trash — { ids: [...], action: "trash"|"restore" }
     *
     * Trash records original_album + trashed_at (so RESTORE knows where to
     * send it back). Restore returns a photo to its original album if that
     * album still exists, otherwise to the first album (SUMMER 24).
     */
    public function updateTrash(Request $request): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if ($actor->is_guest) {
            return response()->json(['error' => 'GUESTS CANNOT TRASH'], 403);
        }

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'string',
            'action' => 'required|in:trash,restore',
        ]);

        $ids = $data['ids'];
        $fallback = Album::query()->orderBy('id')->value('name') ?? 'SUMMER 24';

        Photo::query()->whereIn('id', $ids)->get()->each(function (Photo $p) use ($actor, $data, $fallback) {
            if ($data['action'] === 'trash') {
                // Any member may trash a photo; it records who did it.
                $p->update([
                    'trashed' => true,
                    'original_album' => $p->album,
                    'deleted_by' => $actor->id,
                    'trashed_at' => now(),
                ]);
            } else {
                $dest = ($p->original_album && Album::query()->where('name', $p->original_album)->exists())
                    ? $p->original_album
                    : $fallback;
                $p->update([
                    'trashed' => false,
                    'album' => $dest,
                    'original_album' => null,
                    'deleted_by' => null,
                    'trashed_at' => null,
                ]);
            }
        });

        return response()->json(['ok' => true]);
    }

    /** POST /api/photos/move — { ids: [...], album } — bulk move to an album. */
    public function move(Request $request): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if ($actor->is_guest) {
            return response()->json(['error' => 'GUESTS CANNOT MOVE'], 403);
        }

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'string',
            'album' => 'required|string|max:60',
        ]);

        $album = strtoupper($data['album']);

        if (! Album::query()->where('name', $album)->exists()) {
            return response()->json(['error' => 'ALBUM NOT FOUND'], 422);
        }

        Photo::query()->whereIn('id', $data['ids'])->update(['album' => $album]);

        return response()->json(['ok' => true]);
    }

    /**
     * DELETE /api/photos/{id} — PERMANENT delete. Purges the R2 object via
     * the Worker (DELETE /photos/<id> then DELETE /file/<key>) and removes
     * the local row.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if ($actor->is_guest) {
            return response()->json(['error' => 'GUESTS CANNOT DELETE'], 403);
        }

        if (! $actor->is_admin) {
            return response()->json(['error' => 'ADMIN ONLY'], 403);
        }

        $local = Photo::query()->find($id);

        $ok = $this->worker->deletePhoto($id, $local?->key);

        if (! $ok) {
            return response()->json(['error' => 'DELETE FAILED'], 502);
        }

        $local?->delete();
        $this->forgetVisibility($id);

        return response()->json(['ok' => true]);
    }

    /**
     * DELETE /api/photos/trash/empty — EMPTY TRASH (admin). Permanently
     * deletes every trashed photo (R2 object + local row).
     */
    public function emptyTrash(Request $request): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if (! $actor->is_admin) {
            return response()->json(['error' => 'ADMIN ONLY'], 403);
        }

        $trashed = Photo::query()->where('trashed', true)->get();
        $deleted = 0;

        foreach ($trashed as $p) {
            if ($this->worker->deletePhoto($p->id, $p->key)) {
                $p->delete();
                $this->forgetVisibility($p->id);
                $deleted++;
            }
        }

        return response()->json(['ok' => true, 'deleted' => $deleted]);
    }

    /**
     * GET /api/photos/file/{key} — same-origin proxy to the Worker's
     * /file/<key> endpoint. The frontend loads images/videos through here so
     * it only ever talks to this API (never the Worker or R2 directly).
     *
     * Visibility is enforced HERE as well as in the list, otherwise a
     * restricted photo's bytes would still be readable by anyone who knew or
     * guessed the object key. A photo with no visibility rows (or no local
     * row at all) stays public, exactly as before.
     *
     * Restricted responses are marked no-store: an immutable year-long cache
     * header on private content would let a shared cache keep serving it
     * after the uploader un-shared it.
     */
    public function file(Request $request, string $key)
    {
        $photo = Photo::query()->where('key', $key)->first();

        // null = not restricted; empty collection = also not restricted.
        $allowed = $photo
            ? MediaVisibility::query()->where('media_id', $photo->id)->pluck('allowed_viewer_user_id')
            : null;

        $restricted = $allowed !== null && $allowed->isNotEmpty();

        if ($restricted) {
            /** @var Member|null $actor */
            $actor = $request->attributes->get('famvault_member');

            if (! $actor || $actor->is_guest || ! $allowed->contains($actor->id)) {
                return response()->json(['error' => 'NOT SHARED WITH YOU'], 403);
            }
        }

        try {
            $res = $this->worker->getFile($key);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'FILE FETCH FAILED'], 502);
        }

        if ($res->failed()) {
            return response('Not found', $res->status());
        }

        $headers = [
            'Content-Type' => $res->header('Content-Type') ?: 'application/octet-stream',
            'Cache-Control' => $restricted
                ? 'private, no-store, max-age=0'
                : 'public, max-age=31536000, immutable',
        ];

        return response($res->body(), 200, $headers);
    }

    // ------------------------------------------------------- VISIBILITY

    /** photo id -> [allowed viewer ids]. One query, no N+1. */
    private function visibilityMap(array $photoIds): array
    {
        if ($photoIds === []) {
            return [];
        }

        $map = [];

        MediaVisibility::query()
            ->whereIn('media_id', $photoIds)
            ->get()
            ->each(function (MediaVisibility $row) use (&$map) {
                $map[$row->media_id][] = $row->allowed_viewer_user_id;
            });

        return $map;
    }

    /**
     * Accept an allow-list as either a JSON array or a comma string (the
     * upload form already posts `tagged` as CSV, so both shapes exist here),
     * and reduce it to member ids that actually exist and aren't guests.
     *
     * Dropping unknown ids matters: a typo or a stale id would otherwise
     * silently narrow a photo to nobody, which reads as "public" in the UI
     * but behaves as "restricted" in the database.
     */
    private function normalizeViewers(mixed $raw): array
    {
        if (is_string($raw)) {
            $raw = array_filter(array_map('trim', explode(',', $raw)));
        }

        if (! is_array($raw) || $raw === []) {
            return [];
        }

        $ids = array_values(array_unique(array_map('strval', $raw)));

        return Member::query()
            ->where('is_guest', false)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();
    }

    /** Replace a photo's allow-list wholesale. Empty $ids = public again. */
    private function writeVisibility(string $photoId, array $ids): void
    {
        MediaVisibility::query()->where('media_id', $photoId)->delete();

        if ($ids === []) {
            return;
        }

        MediaVisibility::query()->insert(
            array_map(fn (string $viewerId) => [
                'media_id' => $photoId,
                'allowed_viewer_user_id' => $viewerId,
                'created_at' => now(),
            ], array_values(array_unique($ids))),
        );
    }

    /** Drop a photo's visibility rows when the photo itself goes away. */
    private function forgetVisibility(string $photoId): void
    {
        MediaVisibility::query()->where('media_id', $photoId)->delete();
    }
}