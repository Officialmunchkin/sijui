<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A family member. Mirrors the SEED_MEMBERS shape from the original app:
 * id (handle), name, relation, bio, birthday (MM-DD), color, initial,
 * isAdmin / isGuest flags. Passwords are hashed here (the original kept
 * them in plain localStorage — the API is the upgrade).
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
}
