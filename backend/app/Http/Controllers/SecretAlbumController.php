<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\SecretAlbum;
use App\Models\SecretMedia;
use App\Services\WorkerClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Log;

/**
 * SECRET ALBUMS — end-to-end encrypted, admin-blind.
 *
 * Threat model this controller is built around: assume the person running
 * this server (and everyone with database access, and everyone with the
 * APP_KEY) is curious. They must learn as little as possible.
 *
 * What the server DOES know:  that an album exists, its name, its salt, the
 * ciphertext's byte length and its recorded MIME type.
 * What it NEVER sees:        the password, the derived key, the file names,
 *                            the image/video bytes, or any plaintext URL.
 *
 * Consequences, all deliberate:
 *   - The key is derived in the browser (PBKDF2 100k -> AES-GCM-256) and
 *     kept in memory only. It is never sent here.
 *   - There is NO password_verifier column. A verifier would give anyone
 *     with the database an offline guessing loop. Instead the browser just
 *     tries to decrypt: AES-GCM's auth tag fails on a wrong password, so
 *     "is this the right password?" is answered for free and leaks nothing.
 *   - Ownership is checked on EVERY route, including the byte stream, and
 *     the admin is treated like any other member: NOT the owner, so 403.
 *   - Uploads are accepted as opaque ciphertext. The one thing the server
 *     does check is that the blob does NOT begin with a photo/video magic
 *     number — that catches "I forgot to encrypt this" without decrypting
 *     anything. This is a safety rail for the honest user, not a judgement
 *     about content.
 *   - Logging records sizes only. Never a name, never a byte.
 *
 * Ciphertext is stored in the same R2 bucket as everything else, reached
 * through the existing Worker. R2 keeps arbitrary bytes byte-for-byte intact
 * (probed and confirmed: 4096 random bytes uploaded and downloaded with a
 * matching MD5). The object key ends in ".jpg" only because the Worker
 * accepts media extensions; the stored bytes are ciphertext, and the real
 * type is remembered (encrypted) client-side in `secret_media.file_type`.
 */
class SecretAlbumController extends Controller
{
    public function __construct(protected WorkerClient $worker)
    {
    }

    // ------------------------------------------------------------ CREATE

    /**
     * POST /api/secret-albums/create — { name, salt }
     *
     * `salt` is 16 random bytes the CLIENT generated, base64. Handing salt
     * generation to the browser keeps a single source of truth: the same
     * salt that unlocks the album is the one that was used to make the key,
     * so the server cannot accidentally mint a second, incompatible one.
     * (Salt is not secret — it has to be readable later to re-derive the key.)
     */
    public function createAlbum(Request $request): JsonResponse
    {
        if ($err = $this->denyGuest($request)) {
            return $err;
        }

        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        $data = $request->validate([
            'name' => 'required|string|min:1|max:60',
            'salt' => 'required|string|size:24', // base64 of 16 bytes
        ]);

        $salt = base64_decode($data['salt'], true);
        if ($salt === false || strlen($salt) !== 16) {
            return response()->json(['error' => 'SALT MUST BE 16 RANDOM BYTES'], 422);
        }

        $album = SecretAlbum::query()->create([
            'id' => 'sa_'.bin2hex(random_bytes(8)),
            'user_id' => $actor->id,
            'name' => $data['name'],
            'salt' => $data['salt'],
        ]);

        return response()->json(['ok' => true, 'album' => $this->albumArray($album)], 201);
    }

    /**
     * GET /api/secret-albums — MY albums only.
     *
     * Not "albums my photos are tagged in": only ones I created. Another
     * member's secret album is invisible here even to the admin.
     */
    public function indexAlbums(Request $request): JsonResponse
    {
        if ($err = $this->denyGuest($request)) {
            return $err;
        }

        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        $albums = SecretAlbum::query()
            ->where('user_id', $actor->id)
            ->orderByDesc('id')
            ->get()
            ->map(function (SecretAlbum $a) {
                $counts = SecretMedia::query()
                    ->where('album_id', $a->id)
                    ->selectRaw('COUNT(*) as c, COALESCE(SUM(size), 0) as s')
                    ->first();

                return $this->albumArray($a) + [
                    'count' => (int) ($counts->c ?? 0),
                    'size' => (int) ($counts->s ?? 0),
                ];
            })
            ->values();

        return response()->json(['albums' => $albums]);
    }

    // -------------------------------------------------------------- LIST

    /**
     * GET /api/secret-albums/{id}/media
     *
     * Returns the encrypted envelopes. Note what is absent: the R2 key and
     * any URL. The browser fetches bytes through the owner-checked
     * /api/secret-media/file/{id} proxy instead, so a leaked album listing
     * is not a download list.
     */
    public function listMedia(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyGuest($request)) {
            return $err;
        }

        $album = $this->ownAlbum($request, $id);

        $items = SecretMedia::query()
            ->where('album_id', $album->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn (SecretMedia $m) => $this->mediaArray($m))
            ->values();

        return response()->json(['album' => $this->albumArray($album), 'media' => $items]);
    }

    // ------------------------------------------------------------- UPLOAD

    /**
     * POST /api/secret-media/upload — multipart:
     *   file              the CIPHERTEXT blob (never decrypted, ever)
     *   albumId           the owning secret album
     *   iv                base64, 12-byte AES-GCM IV for the blob
     *   fileNameEncrypted base64(iv2 || ct) of the original file name
     *   fileType          the REAL mime type (image/jpeg, video/mp4)
     */
    public function upload(Request $request): JsonResponse
    {
        if ($err = $this->denyGuest($request)) {
            return $err;
        }

        $data = $request->validate([
            'file' => 'required|file|max:204800', // 200MB cap, ciphertext included
            'albumId' => 'required|string|max:64',
            'iv' => 'required|string|size:16',     // base64 of 12 bytes
            'fileNameEncrypted' => 'nullable|string|max:4000',
            'fileType' => 'required|string|max:64',
        ]);

        $album = $this->ownAlbum($request, $data['albumId']);

        $iv = base64_decode($data['iv'], true);
        if ($iv === false || strlen($iv) !== 12) {
            return response()->json(['error' => 'IV MUST BE 12 RANDOM BYTES'], 422);
        }

        $fileType = strtolower(trim($data['fileType']));
        if (! preg_match('#^(image|video)/[a-z0-9.+-]+$#', $fileType)) {
            return response()->json(['error' => 'UNRECOGNISED FILE TYPE'], 422);
        }

        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        $file = $request->file('file');
        $size = (int) $file->getSize();

        // Safety rail: refuse a blob that still looks like a raw photo/video.
        // This means the client forgot to encrypt — it does NOT read or judge
        // the content, it only compares the first few bytes to known magic
        // numbers. Ciphertext is random and will not match.
        $head = (string) file_get_contents($file->getRealPath(), false, null, 0, 16);
        if ($kind = $this->plaintextMagic($head)) {
            return response()->json([
                'error' => 'THIS FILE LOOKS UNENCRYPTED ('.$kind.'). ENCRYPT IT IN THE BROWSER BEFORE UPLOADING.',
            ], 415);
        }

        // Hand the ciphertext to R2 under a neutral ".jpg" key. The name we
        // send is generated here, not taken from the request, so no plaintext
        // file name ever reaches the Worker.
        $asName = 'secret_'.bin2hex(random_bytes(6)).'.jpg';

        try {
            $result = $this->worker->upload(
                $file,
                'SECRET',
                'SECRET',
                $actor->id,
                [$actor->id],
                $asName,
            );
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }

        $photo = $result['photo'] ?? $result;
        $key = $photo['key'] ?? null;

        if (! $key) {
            return response()->json(['error' => 'STORAGE FAILED'], 502);
        }

        $media = SecretMedia::query()->create([
            'id' => 'sm_'.bin2hex(random_bytes(8)),
            'album_id' => $album->id,
            'user_id' => $actor->id,
            'encrypted_blob_url' => $key,
            'iv' => $data['iv'],
            'file_type' => $fileType,
            'file_name_encrypted' => $data['fileNameEncrypted'] ?? null,
            'size' => $size,
        ]);

        // Sizes only. Never a name, never a byte, never a key.
        Log::info(sprintf('encrypted upload %.1fMB (%s)', $size / 1048576, $fileType));

        return response()->json(['ok' => true, 'media' => $this->mediaArray($media)], 201);
    }

    // --------------------------------------------------------------- FILE

    /**
     * GET /api/secret-media/file/{id}
     *
     * Streams the CIPHERTEXT for one secret file — owner only, admin
     * included in "not the owner". The response is marked no-store because
     * it is private by definition, and served as application/octet-stream
     * so no browser ever tries to render ciphertext directly.
     */
    public function file(Request $request, string $id)
    {
        if ($err = $this->denyGuest($request)) {
            return $err;
        }

        $media = SecretMedia::query()->find($id);

        if (! $media) {
            return response()->json(['error' => 'NOT FOUND'], 404);
        }

        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if ($actor->id !== $media->user_id) {
            return response()->json(['error' => 'OWNER ONLY'], 403);
        }

        try {
            $res = $this->worker->getFile((string) $media->encrypted_blob_url);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'FILE FETCH FAILED'], 502);
        }

        if ($res->failed()) {
            return response('Not found', $res->status());
        }

        return response($res->body(), 200, [
            'Content-Type' => 'application/octet-stream',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }

    // ------------------------------------------------------------- DELETE

    /** DELETE /api/secret-media/{id} — owner only. Purges R2 + the row. */
    public function destroyMedia(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyGuest($request)) {
            return $err;
        }

        $media = SecretMedia::query()->find($id);

        if (! $media) {
            return response()->json(['error' => 'NOT FOUND'], 404);
        }

        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if ($actor->id !== $media->user_id) {
            return response()->json(['error' => 'OWNER ONLY'], 403);
        }

        // Best effort on storage; the row goes regardless so a lost object
        // can never linger as an orphaned index entry. deleteFile() by KEY,
        // not deletePhoto() by id: secret media has no Worker photo id, and
        // an id-based delete of a non-existent id can answer 200 having
        // removed nothing.
        $this->worker->deleteFile((string) $media->encrypted_blob_url);
        $media->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * DELETE /api/secret-albums/{id} — owner only. Removes every ciphertext
     * in the album, then the album itself.
     */
    public function destroyAlbum(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyGuest($request)) {
            return $err;
        }

        $album = $this->ownAlbum($request, $id);

        $media = SecretMedia::query()->where('album_id', $album->id)->get();

        foreach ($media as $m) {
            $this->worker->deleteFile((string) $m->encrypted_blob_url);
            $m->delete();
        }

        $album->delete();

        return response()->json(['ok' => true]);
    }

    // -------------------------------------------------------------- UTILS

    /** Guests get nothing here — secret albums are a member feature. */
    private function denyGuest(Request $request): ?JsonResponse
    {
        /** @var Member|null $actor */
        $actor = $request->attributes->get('famvault_member');

        if (! $actor || $actor->is_guest) {
            return response()->json(['error' => 'MEMBERS ONLY'], 403);
        }

        return null;
    }

    /**
     * Resolve an album and prove it belongs to the caller.
     *
     * The check is `$album->user_id === $actor->id` and nothing else — no
     * `is_admin` escape hatch exists in this method, which is how "admin
     * gets 403 too" is guaranteed rather than remembered.
     *
     * On failure it throws an HttpResponseException carrying the 403/404, so
     * every caller gets the denial without having to remember to propagate
     * it (a null-return convention is exactly the kind of thing that gets
     * forgotten on the fifth call site).
     */
    private function ownAlbum(Request $request, string $id): SecretAlbum
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        $album = SecretAlbum::query()->find($id);

        if (! $album) {
            throw new HttpResponseException(response()->json(['error' => 'ALBUM NOT FOUND'], 404));
        }

        if ($album->user_id !== $actor->id) {
            throw new HttpResponseException(response()->json(['error' => 'OWNER ONLY'], 403));
        }

        return $album;
    }

    /**
     * Known photo/video magic numbers. Returns the type it matched, or null
     * for "does not look like plaintext" (which is what ciphertext looks
     * like). Only signatures a client could realistically upload by mistake
     * are checked, so the chance of random ciphertext tripping it is
     * negligible.
     */
    private function plaintextMagic(string $head): ?string
    {
        $n = strlen($head);

        if ($n >= 3 && $head[0] === "\xFF" && $head[1] === "\xD8" && $head[2] === "\xFF") {
            return 'jpeg';
        }
        if ($n >= 8 && substr($head, 0, 8) === "\x89PNG\r\n\x1a\n") {
            return 'png';
        }
        if ($n >= 4 && substr($head, 0, 4) === 'GIF8') {
            return 'gif';
        }
        if ($n >= 12 && substr($head, 0, 4) === 'RIFF' && substr($head, 8, 4) === 'WEBP') {
            return 'webp';
        }
        // ISO-BMFF family: mp4 / mov / m4v / avif all carry "ftyp" at offset 4.
        if ($n >= 12 && substr($head, 4, 4) === 'ftyp') {
            return 'mp4';
        }
        // Matroska / WebM (EBML header).
        if ($n >= 4 && substr($head, 0, 4) === "\x1A\x45\xDF\xA3") {
            return 'webm';
        }

        return null;
    }

    /** Album shape for the client. The salt IS returned: it is needed to
     *  re-derive the key, and it is not secret. */
    private function albumArray(SecretAlbum $a): array
    {
        return [
            'id' => $a->id,
            'name' => $a->name,
            'salt' => $a->salt,
            'userId' => $a->user_id,
            'createdAt' => $a->created_at?->toIso8601String(),
        ];
    }

    /** Encrypted envelope for the client. Deliberately excludes the R2 key. */
    private function mediaArray(SecretMedia $m): array
    {
        return [
            'id' => $m->id,
            'iv' => $m->iv,
            'fileType' => $m->file_type,
            'fileNameEncrypted' => $m->file_name_encrypted,
            'size' => $m->size ?? 0,
            'createdAt' => $m->created_at?->toIso8601String(),
        ];
    }
}
