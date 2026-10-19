<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->string('id')->primary();          // worker id, e.g. p1792317738861tgyu40
            $table->string('key')->nullable();        // R2 object key, e.g. photos/pXXX.jpg
            $table->text('src')->nullable();          // public Worker /file/ URL
            $table->string('type', 16)->default('image');
            $table->string('album')->default('');
            $table->string('uploaded_by')->nullable();
            $table->json('tagged')->nullable();
            $table->text('caption')->nullable();
            $table->date('photo_date')->nullable();
            $table->unsignedInteger('likes')->default(0);
            $table->unsignedBigInteger('size')->default(0);
            $table->string('file_name')->nullable();
            $table->boolean('trashed')->default(false);
            $table->string('original_album')->nullable();
            $table->timestamp('trashed_at')->nullable();
            $table->timestamps();

            $table->index('album');
            $table->index('trashed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
