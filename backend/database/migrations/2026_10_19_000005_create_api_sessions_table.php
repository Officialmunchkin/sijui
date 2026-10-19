<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('member_id');
            $table->string('token', 80)->unique();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_sessions');
    }
};
