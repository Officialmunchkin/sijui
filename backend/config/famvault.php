<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Famvault — Cloudflare Worker / R2 bridge
    |--------------------------------------------------------------------------
    |
    | Photos and files never touch this server's disk: every R2 operation is
    | proxied through the Cloudflare Worker (famvault-r2), exactly like the
    | original single-file app did. The Worker keeps the R2 keys server-side.
    |
    | Worker endpoints used:
    |   GET    /photos              -> list photo metadata
    |   GET    /file/<key>          -> stream a file from R2
    |   POST   /upload              -> multipart upload (rejects guests)
    |   DELETE /photos/<id>         -> delete a photo (fallback: /file/<key>)
    |   POST   /photos/trash        -> { ids, action: trash|restore }
    |   POST   /photos/update-album -> { from, to }
    |   GET    /board               -> { posts: [...] }
    |   POST   /board               -> { posts: [...] }
    |
    */

    'worker_url' => rtrim(env('WORKER_API_URL', 'https://famvault-r2.famvault.workers.dev'), '/'),

    // The Worker gates writes behind this header (guests are rejected).
    'role_header' => env('WORKER_ROLE_HEADER', 'X-Famvault-Role'),

    'member_role' => env('WORKER_MEMBER_ROLE', 'member'),

    // Seconds before an upstream Worker call is abandoned.
    'timeout' => (int) env('WORKER_TIMEOUT', 15),

    /*
     * Optional path to a CA bundle. Windows PHP builds ship without curl.cainfo
     * configured, which makes Guzzle fail with "SSL certificate problem:
     * unable to get local issuer certificate". Point this at storage/app/cacert.pem
     * (a copy of https://curl.se/ca/cacert.pem) on such setups; leave empty on
     * Linux/macOS where the system trust store already works.
     */
    'ca_bundle' => (function () {
        $path = env('WORKER_CA_BUNDLE');

        if (! $path) {
            return null;
        }

        // Relative paths are resolved against the project root so cURL always
        // receives an absolute filename (it rejects relative CA paths).
        if (! preg_match('#^(?:[A-Za-z]:[\\\\/]|/)#', $path)) {
            $path = base_path($path);
        }

        return file_exists($path) ? $path : null;
    })(),

    'bucket' => env('R2_BUCKET_NAME', 'familyvault'),

    // Only this member id gets the admin flag seeded; matches the original app.
    'admin_id' => env('FAMVAULT_ADMIN_ID', 'herman'),

    // How long an API session token stays valid.
    'session_days' => (int) env('FAMVAULT_SESSION_DAYS', 30),

    // Base URL used when building file links that point back at the Worker.
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

];
