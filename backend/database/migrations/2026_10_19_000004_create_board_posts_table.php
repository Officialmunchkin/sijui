<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('board_posts', function (Blueprint $table) {
            $table->id();
            $table->string('member_id')->nullable();
            $table->string('user');
            $table->text('text');
            $table->string('color', 16)->default('#F59E0B');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_posts');
    }
};
