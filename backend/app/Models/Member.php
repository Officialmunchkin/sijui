<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

/**
 * A family member. Mirrors the SEED_MEMBERS shape from the original app:
 * id (handle), name, relation, bio, birthday (MM-DD), color, initial,
 * isAdmin / isGuest flags. Passwords are hashed for login (password_hash);
 * an AES-encrypted copy (password_secret) is kept so the admin can VIEW a
 * member's password from the ADMIN tab — a deliberate family-vault feature.
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
        'password_secret',
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
     * Set a member's password: store the bcrypt hash (login source of truth)
     * plus an AES-encrypted copy so the admin can view it later.
     */
    public function setPassword(string $plain): void
    {
        $this->password_hash = Hash::make($plain);
        $this->password_secret = Crypt::encryptString($plain);
    }

    /** Decrypted (viewable) password for the admin — null when unset. */
    public function viewablePassword(): ?string
    {
        if (! $this->password_secret) {
            return null;
        }

        try {
            return Crypt::decryptString($this->password_secret);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
