<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Secret Albums — admin-blind, end-to-end encrypted.
 *
 * Only TWO pieces of key material ever touch this server:
 *   salt  — random 16 bytes the CLIENT generated (needed to re-derive the key)
 *
 * There is deliberately NO password_verifier column. A verifier would let
 * anyone with database access (including admin) run an offline guessing loop
 * to recover the album password. Instead the browser derives the key and just
 * tries to decrypt: AES-GCM's auth tag fails on a wrong password, so the
 * "is this right?" check costs nothing and leaks nothing.
 *
 * There is no plaintext content column of any kind here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('secret_albums', function (Blueprint $table) {
            $table->string('id')->primary();          // sa_<random>
            $table->string('user_id');                // owning member id (NOT admin)
            $table->string('name')->default('');
            $table->text('salt');                     // base64 of 16 random bytes
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secret_albums');
    }
};
