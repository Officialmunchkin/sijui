<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A Secret Album — end-to-end encrypted, admin-blind.
 *
 * The server stores ONLY a name and the random salt the browser generated.
 * It never receives the password, never derives a key, and never decrypts
 * anything. There is deliberately no password_verifier column: a verifier
 * would hand anyone with database access an offline guessing loop. Instead
 * the browser derives the key (PBKDF2 100k) and just tries to decrypt —
 * AES-GCM's auth tag rejects a wrong password, for free, leaking nothing.
 */
class SecretAlbum extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'salt',
    ];

    public function media()
    {
        return $this->hasMany(SecretMedia::class, 'album_id');
    }
}
