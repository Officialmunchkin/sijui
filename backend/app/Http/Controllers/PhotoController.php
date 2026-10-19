<?php

namespace App\Http\Controllers;

use App\Models\Album;
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
     */
    public function index(Request $request): JsonResponse
    {
        $query = Photo::query()->where('trashed', false);

        if (($album = $request->query('album')) && strtoupper($album) !== 'ALL') {
            $query->where('album', strtoupper($album));
        }

        $photos = $query->orderByDesc('id')->get()->map(fn (Photo $p) => $p->toClientArray());

        return response()->json(['photos' => $photos]);
    }

    /** GET /api/photos/trash — trashed items (newest trashed first). */
    public function trash(): JsonResponse
    {
        $items = Photo::query()
            ->where('trashed', true)
            ->orderByDesc('trashed_at')
            ->get()
            ->map(fn (Photo $p) => $p->toClientArray() + [
                'originalAlbum' => $p->original_album,
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

        return response()->json(['ok' => true, 'photo' => Photo::query()->find($id)?->toClientArray()], 201);
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
                if (! $actor->is_admin && $p->uploaded_by !== $actor->id) {
                    return; // only admin or uploader may trash
                }
                $p->update([
                    'trashed' => true,
                    'original_album' => $p->album,
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

        $local = Photo::query()->find($id);

        if ($local && ! $actor->is_admin && $local->uploaded_by !== $actor->id) {
            return response()->json(['error' => 'ONLY ADMIN OR UPLOADER CAN DELETE'], 403);
        }

        $ok = $this->worker->deletePhoto($id, $local?->key);

        if (! $ok) {
            return response()->json(['error' => 'DELETE FAILED'], 502);
        }

        $local?->delete();

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
                $deleted++;
            }
        }

        return response()->json(['ok' => true, 'deleted' => $deleted]);
    }

    /**
     * GET /api/photos/file/{key} — same-origin proxy to the Worker's
     * /file/<key> endpoint. The frontend loads images/videos through here so
     * it only ever talks to this API (never the Worker or R2 directly).
     */
    public function file(Request $request, string $key)
    {
        try {
            $res = $this->worker->getFile($key);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'FILE FETCH FAILED'], 502);
        }

        if ($res->failed()) {
            return response('Not found', $res->status());
        }

        $headers = [
            'Content-Type' => $res->header('Content-Type')[0] ?? 'application/octet-stream',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ];

        return response($res->body(), 200, $headers);
    }
}