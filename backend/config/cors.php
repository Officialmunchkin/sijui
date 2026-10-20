<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The famvault React frontend runs on Vite (http://127.0.0.1:5173 locally)
    | and on Netlify in production, and talks to this API. Origins are matched
    | two ways:
    |
    |   allowed_origins         -> exact string match
    |   allowed_origins_patterns -> regex (used for the https://*.netlify.app
    |                               wildcard, which exact matching can't do)
    |
    */

    'paths' => ['api/*', 'file/*'],

    'allowed_methods' => ['*'],

    // Exact origins: anything in CORS_ALLOWED_ORIGINS plus the local dev
    // servers and the R2 Worker endpoint.
    'allowed_origins' => array_values(array_unique(array_filter(array_merge(
        array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))),
        [
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'https://kashifamily.netlify.app',
            'https://famvault-r2.famvault.workers.dev',
        ]
    )))),

    // Wildcard origins must be regexes: every https://<...>.netlify.app host,
    // including deploy previews such as https://abc--site.netlify.app.
    'allowed_origins_patterns' => [
        '#^https://[a-z0-9-]+(\.[a-z0-9-]+)*\.netlify\.app$#i',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    // Bearer tokens are used (Authorization header); cookies are not shared
    // between the frontend origin and this API, so credentials stay off.
    'supports_credentials' => false,

];
