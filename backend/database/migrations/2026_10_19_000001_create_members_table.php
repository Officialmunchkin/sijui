<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->string('id')->primary();          // handle, e.g. "herman"
            $table->string('name');
            $table->string('handle');
            $table->string('relation')->nullable();
            $table->text('bio')->nullable();
            $table->string('birthday', 16)->nullable(); // MM-DD
            $table->string('color', 16)->default('#8B5CF6');
            $table->string('initial', 4)->nullable();
            $table->boolean('is_admin')->default(false);
            $table->boolean('is_guest')->default(false);
            $table->string('password_hash')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
