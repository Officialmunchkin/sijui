<?php

namespace App\Http\Controllers;

use App\Models\ApiSession;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     *
     * Same flow as the original app's login(): first successful password for
     * a member sets it; later attempts must match. Guests are rejected here
     * (they use /auth/guest).
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'memberId' => 'required|string',
            'password' => 'required|string|max:128',
        ]);

        $member = Member::query()
            ->where('id', $data['memberId'])
            ->where('is_guest', false)
            ->first();

        if (! $member) {
            return response()->json(['error' => 'MEMBER NOT FOUND'], 404);
        }

        if (! $member->password_hash) {
            // First login sets the password (original behaviour).
            $member->setPassword($data['password']);
            $member->save();
        } elseif (! Hash::check($data['password'], $member->password_hash)) {
            return response()->json(['error' => 'WRONG PASSWORD • TRY AGAIN'], 401);
        } elseif (! $member->password_secret) {
            // Backfill the viewable secret for hashes stored before it existed.
            $member->password_secret = Crypt::encryptString($data['password']);
            $member->save();
        }

        $session = ApiSession::issue($member);

        return response()->json([
            'ok' => true,
            'token' => $session->token,
            'member' => $member->toClientArray(),
        ]);
    }

    /**
     * POST /api/auth/guest
     *
     * Creates an ephemeral view-only guest (same shape the original app
     * built client-side: guest_<ts>, isGuest: true).
     */
    public function guest(): JsonResponse
    {
        $suffix = substr(bin2hex(random_bytes(6)), 0, 6);
        $id = 'guest_'.$suffix;

        $member = Member::create([
            'id' => $id,
            'name' => 'GUEST_'.strtoupper($suffix),
            'handle' => $id,
            'relation' => 'GUEST',
            'bio' => 'VIEW ONLY GUEST • CANNOT DOWNLOAD OR EDIT',
            'birthday' => '01-01',
            'color' => '#5A5A80',
            'initial' => 'G',
            'is_guest' => true,
            'is_admin' => false,
        ]);

        $session = ApiSession::issue($member);

        return response()->json([
            'ok' => true,
            'token' => $session->token,
            'member' => $member->toClientArray(),
        ]);
    }

    /** GET /api/auth/me */
    public function me(Request $request): JsonResponse
    {
        /** @var Member $member */
        $member = $request->attributes->get('famvault_member');

        return response()->json(['member' => $member->toClientArray()]);
    }

    /** POST /api/auth/logout */
    public function logout(Request $request): JsonResponse
    {
        $request->attributes->get('famvault_session')?->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * POST /api/auth/password
     *
     * Self-service password set/change for a logged-in member. Admin resets
     * go through POST /api/members/{id}/password instead.
     */
    public function setPassword(Request $request): JsonResponse
    {
        /** @var Member $member */
        $member = $request->attributes->get('famvault_member');

        if ($member->is_guest) {
            return response()->json(['error' => 'GUESTS CANNOT SET PASSWORDS'], 403);
        }

        $data = $request->validate([
            'password' => 'required|string|min:2|max:128',
            'currentPassword' => 'required_without:force|string|max:128',
        ]);

        if ($member->password_hash && ! ($data['currentPassword'] ?? null)) {
            throw ValidationException::withMessages([
                'currentPassword' => 'CURRENT PASSWORD REQUIRED',
            ]);
        }

        if ($member->password_hash
            && ! Hash::check($data['currentPassword'], $member->password_hash)
            && ! ($request->boolean('force') && $member->is_admin)) {
            return response()->json(['error' => 'WRONG PASSWORD • TRY AGAIN'], 401);
        }

        $member->setPassword($data['password']);
        $member->save();

        return response()->json(['ok' => true]);
    }
}
