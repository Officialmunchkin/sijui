<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Requires a valid famvault session token.
 *
 * The original app kept its session in localStorage; the API issues a bearer
 * token instead (POST /api/auth/login or /api/auth/guest) which the frontend
 * sends as:  Authorization: Bearer <token>
 * or the convenience header:     X-Famvault-Token: <token>
 */
class EnsureAuthenticatedMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $member = $request->attributes->get('famvault_member');

        if (! $member) {
            return response()->json(['error' => 'NOT AUTHENTICATED'], 401);
        }

        return $next($request);
    }
}
