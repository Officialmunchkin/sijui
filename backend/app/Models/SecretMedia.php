<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One encrypted file inside a Secret Album. See the migration for the exact
 * column semantics — the short version:
 *
 *   encrypted_blob_url -> an R2 OBJECT KEY, never a URL. No public link to
 *                         secret bytes is ever generated; they are served
 *                         only through the owner-checked
 *                         GET /api/secret-media/file/{id} proxy.
 *   iv                  -> base64, 12 bytes, for the blob (AES-GCM).
 *   file_name_encrypted -> base64(iv2 || ciphertext) of the original name,
 *                         on its OWN iv2 — AES-GCM must never reuse an IV.
 *   file_type           -> real MIME, recorded by the client before
 *                         encryption so the browser knows img vs video.
 *
 * The plaintext URL / file name / bytes live nowhere on this server.
 */
class SecretMedia extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'album_id',
        'user_id',
        'encrypted_blob_url',
        'iv',
        'file_type',
        'file_name_encrypted',
        'size',
    ];

    public function album()
    {
        return $this->belongsTo(SecretAlbum::class, 'album_id');
    }
}
