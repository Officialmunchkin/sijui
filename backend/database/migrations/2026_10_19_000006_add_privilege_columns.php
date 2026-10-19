<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Role / privilege columns added for the PATCH pass:
 *
 *  - photos.deleted_by    -> which member trashed a photo / album (shown in
 *                            the admin TRASH view + derived activity log).
 *  - members.password_secret -> an AES-encrypted (Crypt) copy of the password
 *                            so the admin (herman) can VIEW a member's
 *                            password from the ADMIN tab. Hashed password_hash
 *                            stays the source of truth for login; this is a
 *                            deliberate family-vault convenience.
 *
 * Guards with hasColumn so it is safe on both fresh and existing databases.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            if (! Schema::hasColumn('photos', 'deleted_by')) {
                $table->string('deleted_by')->nullable()->after('original_album');
            }
        });

        Schema::table('members', function (Blueprint $table) {
            if (! Schema::hasColumn('members', 'password_secret')) {
                $table->text('password_secret')->nullable()->after('password_hash');
            }
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            if (Schema::hasColumn('photos', 'deleted_by')) {
                $table->dropColumn('deleted_by');
            }
        });

        Schema::table('members', function (Blueprint $table) {
            if (Schema::hasColumn('members', 'password_secret')) {
                $table->dropColumn('password_secret');
            }
        });
    }
};
