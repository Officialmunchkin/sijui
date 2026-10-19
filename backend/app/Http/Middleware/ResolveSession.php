<?php

namespace App\Http\Middleware;

use App\Models\ApiSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attaches the authenticated member (if any) to the request without forcing
 * authentication. Guest sessions attach an ephemeral guest member so the
 * controllers can reuse the same is-guest checks as the original app.
 */
class ResolveSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken()
            ?: $request->header('X-Famvault-Token');

        if ($token) {
            $session = ApiSession::query()
                ->with('member')
                ->where('token', $token)
                ->where('expires_at', '>', now())
                ->first();

            if ($session && $session->member) {
                $request->attributes->set('famvault_member', $session->member);
                $request->attributes->set('famvault_session', $session);
            }
        }

        return $next($request);
    }
}
