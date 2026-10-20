<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

/**
 * A family member. Mirrors the SEED_MEMBERS shape from the original app:
 * id (handle), name, relation, bio, birthday (MM-DD), color, initial,
 * isAdmin / isGuest flags.
 *
 * PASSWORDS ARE HASHED ONLY. `password_hash` (bcrypt) is the sole thing
 * stored — there is no encrypted copy, no plaintext column, and no way for
 * anyone (including the admin, including whoever holds APP_KEY) to read a
 * member's password back. The admin can RESET a password to a new value but
 * can never view the current one. The old `password_secret` column that
 * enabled the admin viewer was dropped in migration 2026_10_20_000004.
 */
class Member extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'handle',
        'relation',
        'bio',
        'birthday',
        'color',
        'initial',
        'is_admin',
        'is_guest',
        'password_hash',
    ];

    protected $casts = [
        'is_admin' => 'boolean',
        'is_guest' => 'boolean',
    ];

    /** Shape consumed by the frontend — matches the original localStorage object. */
    public function toClientArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'handle' => $this->handle,
            'relation' => $this->relation,
            'bio' => $this->bio,
            'birthday' => $this->birthday,
            'color' => $this->color,
            'initial' => $this->initial,
            'isAdmin' => $this->is_admin,
            'isGuest' => $this->is_guest,
            'hasPassword' => (bool) $this->password_hash,
        ];
    }

    public function sessions()
    {
        return $this->hasMany(ApiSession::class);
    }

    /**
     * Set a member's password. Stores the bcrypt hash and nothing else —
     * the plaintext is discarded the moment this returns.
     */
    public function setPassword(string $plain): void
    {
        $this->password_hash = Hash::make($plain);
    }
}
