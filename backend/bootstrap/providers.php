<?php

return [
    App\Providers\AppServiceProvider::class,

    // Registers the `libsql` connection driver (Turso) used in production.
    // The package also declares itself in extra.laravel.providers, but the
    // upgrade guide asks for an explicit registration so the 'db.factory'
    // rebind always happens after the framework's own providers.
    Turso\Driver\Laravel\LibSQLDriverServiceProvider::class,
];
