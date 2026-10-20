<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One encrypted file inside a Secret Album.
 *
 * Column names follow the feature spec; what each one actually holds:
 *
 *   encrypted_blob_url   -> the R2 OBJECT KEY (e.g. photos/p1792....jpg).
 *                           Deliberately NOT a URL: no public link to any
 *                           secret blob is ever generated or returned. Bytes
 *                           are only served through the owner-checked
 *                           GET /api/secret-media/file/{id} proxy. The
 *                           ".jpg" extension is a Worker requirement only —
 *                           the stored bytes are ciphertext, which the probe
 *                           confirmed R2 keeps byte-for-byte intact.
 *   iv                   -> base64 of the 12-byte AES-GCM IV for the BLOB.
 *   file_name_encrypted  -> base64(iv2 || ciphertext) for the original file
 *                           NAME. It uses its OWN iv2 because reusing one
 *                           AES-GCM IV across two messages is unsafe.
 *   file_type            -> the real type (image/jpeg, video/mp4) recorded
 *                           CLIENT-side before encryption, so the browser
 *                           knows whether to render <img> or <video>.
 *
 * The server never decrypts, never derives a key, and never stores one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('secret_media', function (Blueprint $table) {
            $table->string('id')->primary();                    // sm_<random>
            $table->string('album_id');                         // -> secret_albums.id
            $table->string('user_id');                          // owner (denormalised for cheap owner checks)
            $table->string('encrypted_blob_url')->nullable();   // R2 key of the ciphertext
            $table->text('iv');                                 // base64, 12 bytes, for the blob
            $table->string('file_type')->default('');           // real type, from the client
            $table->text('file_name_encrypted')->nullable();    // base64(iv2 || ct) of the name
            $table->unsignedBigInteger('size')->default(0);     // ciphertext size in bytes
            $table->timestamps();

            $table->index('album_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secret_media');
    }
};
