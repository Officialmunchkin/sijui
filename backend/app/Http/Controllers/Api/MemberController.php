<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MemberController extends Controller
{
    /** GET /api/members — list members (no password/token leakage). */
    public function index()
    {
        return response()->json([
            'members' => Member::orderByDesc('created_at')->get()->map->only([
                'id', 'name', 'handle', 'relation', 'bio', 'birthday',
                'color', 'initial', 'is_admin', 'is_guest',
            ])->values(),
            'passwords' => Member::whereNotNull('password')->pluck('id')->values(),
        ]);
    }

    /** POST /api/members — admin adds a member. */
    public function store(Request $request)
    {
        $f = $request->validate([
            'name' => 'required|string|max:60',
            'relation' => 'nullable|string|max:40',
            'birthday' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
            'is_admin' => 'nullable|boolean',
            'is_guest' => 'nullable|boolean',
        ]);

        $isGuest = (bool) ($f['is_guest'] ?? false);
        $base = Str::slug($f['name'], '_');
        $id = $base . '_' . Str::lower(Str::random(4));

        $member = Member::create([
            'id' => $id,
            'name' => strtoupper($f['name']),
            'handle' => $id,
            'relation' => strtoupper($f['relation'] ?? 'FAMILY'),
            'bio' => strtoupper($f['bio'] ?? 'NEW MEMBER OF FAM VAULT'),
            'birthday' => $f['birthday'] ?: '01-01',
            'color' => $f['color'] ?? '#8B5CF6',
            'initial' => Str::upper(Str::substr($f['name'], 0, 1)),
            'is_admin' => $isGuest ? false : (bool) ($f['is_admin'] ?? false),
            'is_guest' => $isGuest,
        ]);

        return response()->json(['member' => $this->shape($member)]);
    }

    /** PUT /api/members/{id} — admin edits a member. */
    public function update(Request $request, $id)
    {
        $member = Member::find($id);
        if (!$member) return response()->json(['error' => 'NOT FOUND'], 404);

        $f = $request->validate([
            'name' => 'nullable|string|max:60',
            'relation' => 'nullable|string|max:40',
            'birthday' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
            'is_admin' => 'nullable|boolean',
            'is_guest' => 'nullable|boolean',
        ]);

        $isGuest = array_key_exists('is_guest', $f) ? (bool) $f['is_guest'] : $member->is_guest;
        $member->name = strtoupper($f['name'] ?? '') ?: $member->name;
        $member->relation = strtoupper($f['relation'] ?? '') ?: $member->relation;
        $member->birthday = $f['birthday'] ?? $member->birthday;
        $member->bio = strtoupper($f['bio'] ?? '') ?: $member->bio;
        $member->color = $f['color'] ?? $member->color;
        $member->is_guest = $isGuest;
        $member->is_admin = $isGuest ? false : (bool) ($f['is_admin'] ?? $member->is_admin);
        if (array_key_exists('name', $f) && trim($f['name'] ?? '') !== '') {
            $member->initial = Str::upper(Str::substr(trim($f['name']), 0, 1));
        }
        $member->save();

        return response()->json(['member' => $this->shape($member)]);
    }

    /** DELETE /api/members/{id} */
    public function destroy($id)
    {
        $member = Member::find($id);
        if (!$member) return response()->json(['error' => 'NOT FOUND'], 404);
        $member->delete();
        return response()->json(['ok' => true]);
    }

    /** PUT /api/members/{id}/password — admin set/reset a member password. */
    public function setPassword(Request $request, $id)
    {
        $member = Member::find($id);
        if (!$member) return response()->json(['error' => 'NOT FOUND'], 404);
        $val = (string) $request->input('password', '');
        if ($val === '') {
            $member->password = null; // clear
        } else {
            $member->password = Hash::make($val);
        }
        $member->save();
        return response()->json(['ok' => true]);
    }

    private function shape(Member $m): array
    {
        return $m->only([
            'id', 'name', 'handle', 'relation', 'bio', 'birthday',
            'color', 'initial', 'is_admin', 'is_guest',
        ]);
    }
}
