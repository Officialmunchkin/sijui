<?php

namespace App\Http\Controllers;

use App\Models\ApiSession;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    /**
     * GET /api/members
     *
     * The member grid is public (same as the original app). Guest rows are
     * ephemeral and excluded.
     */
    public function index(): JsonResponse
    {
        $order = ['jermaine', 'lucy', 'faith', 'herman', 'hossam', 'amber'];

        $members = Member::query()
            ->where('is_guest', false)
            ->get()
            // seed order first (jermaine, lucy, faith, herman, hossam, amber), then any added members
            ->sortBy(fn (Member $m) => array_search($m->id, $order) === false ? PHP_INT_MAX : array_search($m->id, $order))
            ->map(fn (Member $m) => $m->toClientArray())
            ->values();

        return response()->json(['members' => $members]);
    }

    /** GET /api/members/{id} */
    public function show(string $id): JsonResponse
    {
        $member = Member::query()->where('id', $id)->first();

        if (! $member) {
            return response()->json(['error' => 'MEMBER NOT FOUND'], 404);
        }

        return response()->json(['member' => $member->toClientArray()]);
    }

    /** POST /api/members — admin only (original ADMIN tab behaviour). */
    public function store(Request $request): JsonResponse
    {
        if ($err = $this->denyNonAdmin($request)) {
            return $err;
        }

        $data = $request->validate([
            'id' => ['required', 'string', 'min:2', 'max:32', 'regex:/^[a-z0-9_]+$/', Rule::unique('members', 'id')],
            'name' => 'required|string|max:40',
            'relation' => 'nullable|string|max:40',
            'bio' => 'nullable|string|max:150',
            'birthday' => 'nullable|string|max:16',
            'color' => 'nullable|string|max:16',
            'initial' => 'nullable|string|max:2',
            'isAdmin' => 'nullable|boolean',
            'isGuest' => 'nullable|boolean',
            'password' => 'nullable|string|max:128',
        ]);

        $member = Member::create([
            'id' => strtolower($data['id']),
            'name' => strtoupper($data['name']),
            'handle' => strtolower($data['id']),
            'relation' => strtoupper($data['relation'] ?? ''),
            'bio' => strtoupper($data['bio'] ?? ''),
            'birthday' => $data['birthday'] ?? '01-01',
            'color' => $data['color'] ?? '#8B5CF6',
            'initial' => strtoupper($data['initial'] ?? mb_substr($data['name'], 0, 1)),
            'is_admin' => (bool) ($data['isAdmin'] ?? false),
            'is_guest' => (bool) ($data['isGuest'] ?? false),
            'password_hash' => null,
        ]);

        if (! empty($data['password'])) {
            $member->setPassword($data['password']);
            $member->save();
        }

        return response()->json(['ok' => true, 'member' => $member->toClientArray()], 201);
    }

    /**
     * PUT /api/members/{id}
     *
     * Admins may edit anything; regular members may only update their own
     * bio (matches saveBio() in the original app).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');
        $member = Member::query()->where('id', $id)->first();

        if (! $member) {
            return response()->json(['error' => 'MEMBER NOT FOUND'], 404);
        }

        $isAdmin = $actor->is_admin && ! $actor->is_guest;

        if (! $isAdmin && $actor->id !== $member->id) {
            return response()->json(['error' => 'ONLY ADMIN OR THE MEMBER CAN EDIT'], 403);
        }

        if ($isAdmin) {
            $data = $request->validate([
                'name' => 'sometimes|string|max:40',
                'relation' => 'nullable|string|max:40',
                'bio' => 'nullable|string|max:150',
                'birthday' => 'nullable|string|max:16',
                'color' => 'nullable|string|max:16',
                'initial' => 'nullable|string|max:2',
                'isAdmin' => 'nullable|boolean',
            ]);

            $member->fill([
                'name' => isset($data['name']) ? strtoupper($data['name']) : $member->name,
                'relation' => strtoupper($data['relation'] ?? $member->relation ?? ''),
                'bio' => strtoupper($data['bio'] ?? $member->bio ?? ''),
                'birthday' => $data['birthday'] ?? $member->birthday,
                'color' => $data['color'] ?? $member->color,
                'initial' => isset($data['initial']) ? strtoupper($data['initial']) : $member->initial,
                'is_admin' => array_key_exists('isAdmin', $data) ? (bool) $data['isAdmin'] : $member->is_admin,
            ]);
        } else {
            $data = $request->validate([
                'bio' => 'required|string|max:150',
            ]);
            $member->bio = strtoupper($data['bio']);
        }

        $member->save();

        return response()->json(['ok' => true, 'member' => $member->toClientArray()]);
    }

    /** DELETE /api/members/{id} — admin only. */
    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyNonAdmin($request)) {
            return $err;
        }

        $member = Member::query()->where('id', $id)->first();

        if (! $member) {
            return response()->json(['error' => 'MEMBER NOT FOUND'], 404);
        }

        if ($member->id === config('famvault.admin_id')) {
            return response()->json(['error' => 'CANNOT DELETE THE ADMIN'], 403);
        }

        $member->delete();

        return response()->json(['ok' => true]);
    }

    /** POST /api/members/{id}/password — admin set/reset (ADMIN tab). */
    public function resetPassword(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyNonAdmin($request)) {
            return $err;
        }

        $member = Member::query()->where('id', $id)->first();

        if (! $member) {
            return response()->json(['error' => 'MEMBER NOT FOUND'], 404);
        }

        $data = $request->validate([
            'password' => 'required|string|min:2|max:128',
        ]);

        $this->applyAdminReset($request, $member, $data['password']);

        return response()->json(['ok' => true]);
    }

    /**
     * POST /api/admin/users/{id}/reset-password — { newPassword }
     *
     * Alias of the above with the shape the spec asks for. Same handler
     * underneath, so there is one place where a reset actually happens.
     *
     * The new password is hashed and never echoed, logged, or stored in
     * plaintext anywhere. What IS recorded is the audit line: who reset
     * whose password, and when — without the value.
     */
    public function adminResetPassword(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyNonAdmin($request)) {
            return $err;
        }

        $member = Member::query()->where('id', $id)->first();

        if (! $member) {
            return response()->json(['error' => 'MEMBER NOT FOUND'], 404);
        }

        $data = $request->validate([
            'newPassword' => 'required|string|min:4|max:128',
        ]);

        $this->applyAdminReset($request, $member, $data['newPassword']);

        return response()->json(['ok' => true]);
    }

    /**
     * GET /api/admin/users — ADMIN ONLY. The member table for the ADMIN tab.
     *
     * Returns id, name, role, hasPassword and createdAt. Deliberately absent:
     * password_hash, password_secret, and any plaintext — this endpoint can
     * report WHETHER a member has a password, never what it is.
     *
     * This app has no email concept (login is by member handle), so there is
     * no email column to return; inventing empty ones would be worse than
     * leaving them out. Role is derived from the two flags rather than stored.
     */
    public function adminUsers(Request $request): JsonResponse
    {
        if ($err = $this->denyNonAdmin($request)) {
            return $err;
        }

        $order = ['jermaine', 'lucy', 'faith', 'herman', 'hossam', 'amber'];

        $users = Member::query()
            ->where('is_guest', false)
            ->get()
            ->sortBy(fn (Member $m) => array_search($m->id, $order) === false ? PHP_INT_MAX : array_search($m->id, $order))
            ->map(fn (Member $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'relation' => $m->relation,
                'role' => $m->is_admin ? 'admin' : 'member',
                'hasPassword' => (bool) $m->password_hash,
                'createdAt' => $m->created_at?->toIso8601String(),
            ])
            ->values();

        return response()->json(['users' => $users]);
    }

    /**
     * Hash + store a new password for a member, on the admin's behalf.
     *
     * The plaintext is passed in, hashed immediately, and never returned,
     * logged, or persisted. Only the audit trail of the EVENT is written.
     */
    private function applyAdminReset(Request $request, Member $member, string $newPassword): void
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        $member->setPassword($newPassword);
        $member->save();

        // Kill that member's existing sessions too: a reset usually means
        // "this person can no longer get in" or "their password leaked", and
        // a password change that leaves stolen tokens valid is theatre.
        ApiSession::query()->where('member_id', $member->id)->delete();

        // Audit trail: WHO, WHOSE, WHEN — never the password itself.
        Log::info(sprintf(
            'Admin reset password for user %s at %s (by %s)',
            $member->id,
            now()->toIso8601String(),
            $actor->id,
        ));
    }

    /**
     * GET /api/members/passwords was removed on purpose.
     *
     * It returned every member's decrypted password to the admin. Passwords
     * are now hashed only: there is nothing on this server that could answer
     * that request even if it were re-added. Use GET /api/admin/users for
     * "who has a password set", and POST /api/admin/users/{id}/reset-password
     * to give someone a new one.
     */

    private function denyNonAdmin(Request $request): ?JsonResponse
    {
        /** @var Member|null $actor */
        $actor = $request->attributes->get('famvault_member');

        if (! $actor || $actor->is_guest || ! $actor->is_admin) {
            return response()->json(['error' => 'ADMIN ONLY'], 403);
        }

        return null;
    }
}
