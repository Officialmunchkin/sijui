<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\UploadedFile;

/**
 * Thin client for the famvault Cloudflare Worker (famvault-r2).
 *
 * The Worker is the single gateway to the R2 bucket "familyvault" — R2
 * credentials never leave Cloudflare, and this backend simply proxies the
 * same endpoints the original single-file app called directly:
 *
 *   GET    /photos               -> { photos: [...] }
 *   GET    /file/<key>           -> binary stream (image/video)
 *   POST   /upload               -> multipart: file, caption, album, uploadedBy, tagged
 *   DELETE /photos/<id>          -> delete by photo id (or /file/<key> by object key)
 *   POST   /photos/trash         -> { ids, action: "trash"|"restore" }
 *   POST   /photos/update-album  -> { from, to }
 *   GET    /board                -> { posts: [...] }
 *   POST   /board                -> { posts: [...] }
 *
 * Write endpoints require the X-Famvault-Role header (the Worker rejects
 * "guest"); the frontend used to send "member" and so does this proxy.
 */
class WorkerClient
{
    public function baseUrl(): string
    {
        return config('famvault.worker_url');
    }

    /** Headers that mark the request as coming from an authenticated member. */
    protected function memberHeaders(): array
    {
        return [
            config('famvault.role_header') => config('famvault.member_role'),
        ];
    }

    /** Base options for every Worker call (CA bundle on Windows, etc.). */
    protected function options(): array
    {
        $ca = config('famvault.ca_bundle');

        return $ca ? ['verify' => $ca] : [];
    }

    /** A pre-configured pending request to the Worker. */
    protected function request(?int $timeout = null)
    {
        return Http::withOptions($this->options())
            ->timeout($timeout ?? config('famvault.timeout'));
    }

    // ---------------------------------------------------------------- READ

    /** GET /photos — newest first, as produced by the Worker. */
    public function listPhotos(): array
    {
        $res = $this->request()->get($this->baseUrl().'/photos');

        if ($res->failed()) {
            throw new \RuntimeException('WORKER LIST FAILED ('.$res->status().')');
        }

        $photos = $res->json('photos', []);

        // The Worker includes `size` on newer objects; normalize like the
        // original frontend did (p.size || p.fileSize || 0).
        return array_map(fn ($p) => $p + ['size' => $p['size'] ?? $p['fileSize'] ?? 0], $photos);
    }

    /** GET /file/<key> — returns the raw PSR-7 response for streaming. */
    public function getFile(string $key)
    {
        return $this->request()
            ->withHeaders(['Accept' => '*/*'])
            ->get($this->baseUrl().'/file/'.$this->encodeKey($key));
    }

    /** GET /board — { posts: [...] } */
    public function getBoard(): array
    {
        $res = $this->request()
            ->get($this->baseUrl().'/board');

        return $res->ok() ? ($res->json('posts') ?? []) : [];
    }

    // --------------------------------------------------------------- WRITE

    /**
     * POST /upload — streams the multipart form straight through to the
     * Worker (no local storage involved; the file goes browser -> Laravel ->
     * Worker -> R2).
     *
     * The file is handed to Guzzle as an open stream, NOT file_get_contents():
     * a 200 MB video would otherwise be copied into PHP memory on top of the
     * multipart body, blowing past memory_limit (and the 512 MB Fly VM).
     */
    public function upload(UploadedFile $file, string $caption, string $album, string $uploadedBy, array $tagged = []): array
    {
        $handle = fopen($file->getRealPath(), 'rb');

        if ($handle === false) {
            throw new \RuntimeException('CANNOT READ UPLOADED FILE');
        }

        try {
            $res = $this->request(max(config('famvault.timeout'), 120))
                ->withHeaders($this->memberHeaders())
                ->attach('file', $handle, $file->getClientOriginalName())
                ->post($this->baseUrl().'/upload', [
                    'caption' => $caption,
                    'album' => $album,
                    'uploadedBy' => $uploadedBy,
                    'tagged' => implode(',', $tagged),
                ]);
        } finally {
            // Always release the temp file, even when the Worker call fails.
            fclose($handle);
        }

        if ($res->failed()) {
            throw new \RuntimeException($res->json('error') ?? 'UPLOAD FAILED ('.$res->status().')');
        }

        return $res->json() ?? [];
    }

    /** DELETE /photos/<id> with the same /file/<key> fallback the app used. */
    public function deletePhoto(string $id, ?string $key = null): bool
    {
        $res = $this->request()
            ->withHeaders($this->memberHeaders())
            ->delete($this->baseUrl().'/photos/'.urlencode($id));

        if (! $res->failed()) {
            return true;
        }

        if ($key) {
            $res = $this->request()
                ->withHeaders($this->memberHeaders())
                ->delete($this->baseUrl().'/file/'.$this->encodeKey($key));

            return ! $res->failed();
        }

        return false;
    }

    /** POST /photos/trash — { ids, action: "trash"|"restore" } */
    public function updateTrash(array $ids, string $action): bool
    {
        $res = $this->request()
            ->withHeaders($this->memberHeaders())
            ->post($this->baseUrl().'/photos/trash', [
                'ids' => $ids,
                'action' => $action,
            ]);

        return ! $res->failed();
    }

    /** POST /photos/update-album — { from, to } (album rename/delete sync). */
    public function updateAlbum(string $from, string $to): bool
    {
        $res = $this->request(3)
            ->withHeaders($this->memberHeaders())
            ->post($this->baseUrl().'/photos/update-album', [
                'from' => $from,
                'to' => $to,
            ]);

        return ! $res->failed();
    }

    /** POST /board — replaces the Worker's stored board posts. */
    public function saveBoard(array $posts): bool
    {
        $res = $this->request()
            ->withHeaders($this->memberHeaders())
            ->post($this->baseUrl().'/board', [
                'posts' => $posts,
            ]);

        return ! $res->failed();
    }

    // -------------------------------------------------------------- UTILS

    /** URL-encode each path segment of an R2 object key. */
    protected function encodeKey(string $key): string
    {
        return implode('/', array_map('rawurlencode', explode('/', $key)));
    }
}
