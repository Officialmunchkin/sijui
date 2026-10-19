<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The famvault React dev server runs on Vite (localhost:5173 by default)
    | and talks to this API. Origins are comma-separated via env so both
    | localhost and the production domain can be whitelisted.
    |
    */

    'paths' => ['api/*', 'file/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    // Bearer tokens are used (Authorization header), cookies are not shared
    // between the Vite origin and this API, so credentials stay off.
    'supports_credentials' => false,

];
