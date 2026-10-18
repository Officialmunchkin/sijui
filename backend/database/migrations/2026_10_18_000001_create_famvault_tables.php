<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->string('id')->primary();          // e.g. "herman", "faith_1a2b"
            $table->string('name');
            $table->string('handle');
            $table->string('relation')->default('FAMILY');
            $table->text('bio')->nullable();
            $table->string('birthday')->nullable();   // "MM-DD" or "YYYY-MM-DD"
            $table->string('color')->default('#8B5CF6');
            $table->string('initial', 4)->nullable();
            $table->boolean('is_admin')->default(false);
            $table->boolean('is_guest')->default(false);
            $table->string('password')->nullable();   // hashed, null until first login sets it
            $table->string('token', 64)->nullable();  // simple session token
            $table->timestamps();
        });

        Schema::create('albums', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('photos', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('key')->nullable();        // storage path
            $table->string('caption')->nullable();
            $table->string('album')->default('UNSORTED');
            $table->string('uploaded_by')->nullable();
            $table->json('tagged')->nullable();       // array of member ids
            $table->string('type')->default('image'); // image | video
            $table->unsignedBigInteger('size')->default(0);
            $table->unsignedInteger('likes')->default(0);
            $table->string('date')->nullable();       // YYYY-MM-DD
            $table->boolean('trashed')->default(false);
            $table->string('original_album')->nullable();
            $table->timestamp('trashed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('board_posts', function (Blueprint $table) {
            $table->id();
            $table->string('post_id')->unique();      // client-generated id
            $table->string('user');
            $table->text('text');
            $table->string('color')->nullable();
            $table->unsignedBigInteger('at')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_posts');
        Schema::dropIfExists('photos');
        Schema::dropIfExists('albums');
        Schema::dropIfExists('members');
    }
};
