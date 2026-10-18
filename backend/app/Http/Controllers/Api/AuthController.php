<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /** POST /api/login — check first-login / password match. */
    public function login(Request $request)
    {
        $id = (string) $request->input('memberId');
        $pw = (string) $request->input('password');
        $member = Member::find($id);
        if (!$member) return response()->json(['error' => 'NOT FOUND'], 404);

        if (!$member->password) {
            // first login sets password
            $member->password = Hash::make($pw);
            $token = Str::random(64);
            $member->token = $token;
            $member->save();
            return response()->json(['ok' => true, 'firstLogin' => true, 'token' => $token, 'member' => $this->shape($member)]);
        }

        if (!Hash::check($pw, $member->password)) {
            return response()->json(['error' => 'WRONG PASSWORD'], 401);
        }

        $token = Str::random(64);
        $member->token = $token;
        $member->save();
        return response()->json(['ok' => true, 'firstLogin' => false, 'token' => $token, 'member' => $this->shape($member)]);
    }

    /** POST /api/guest — create a guest member/session. */
    public function guest()
    {
        $suffix = Str::lower(Str::random(4));
        $id = 'guest_' . $suffix;
        $member = Member::create([
            'id' => $id,
            'name' => 'GUEST_' . strtoupper($suffix),
            'handle' => $id,
            'relation' => 'GUEST',
            'bio' => 'VIEW ONLY GUEST • CANNOT DOWNLOAD OR EDIT',
            'birthday' => '01-01',
            'color' => '#5A5A80',
            'initial' => 'G',
            'is_guest' => true,
            'is_admin' => false,
        ]);
        $token = Str::random(64);
        $member->token = $token;
        $member->save();
        return response()->json(['ok' => true, 'token' => $token, 'member' => $this->shape($member)]);
    }

    private function shape(Member $m): array
    {
        return $m->only([
            'id', 'name', 'handle', 'relation', 'bio', 'birthday',
            'color', 'initial', 'is_admin', 'is_guest',
        ]);
    }
}
