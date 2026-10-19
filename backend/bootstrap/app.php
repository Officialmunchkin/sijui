<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Resolve the bearer/session token on every API request (optional auth);
        // auth.famvault then enforces that a member was resolved.
        $middleware->appendToGroup('api', \App\Http\Middleware\ResolveSession::class);

        $middleware->alias([
            'auth.famvault' => \App\Http\Middleware\EnsureAuthenticatedMember::class,
            'resolve.session' => \App\Http\Middleware\ResolveSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
