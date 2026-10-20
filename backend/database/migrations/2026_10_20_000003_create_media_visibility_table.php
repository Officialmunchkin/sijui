<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Selective Sharing ("Who can see?") — per-photo allow-list.
 *
 * RULE: NO ROWS for a photo == visible to all family (the default). A photo
 * only becomes private when at least one row exists naming who may still see
 * it. So every existing photo keeps working untouched, and the upload form
 * can offer [ALL FAMILY] simply by writing nothing.
 *
 * The uploader is always inserted as an allowed viewer (otherwise sharing a
 * photo with a subset would hide it from the person who posted it).
 *
 * This is a pure join table: photos.id  <->  members.id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_visibility', function (Blueprint $table) {
            $table->id();
            $table->string('media_id');                 // -> photos.id
            $table->string('allowed_viewer_user_id');   // -> members.id
            $table->timestamp('created_at')->nullable();

            // One row per (photo, viewer) — a repeated share can't stack dupes.
            $table->unique(['media_id', 'allowed_viewer_user_id']);
            $table->index('allowed_viewer_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_visibility');
    }
};
