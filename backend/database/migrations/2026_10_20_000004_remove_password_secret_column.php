<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Remove the admin plaintext-password viewer.
 *
 * members.password_secret used to hold an AES-encrypted copy of every
 * password so the admin could VIEW them from the ADMIN tab. That made the
 * database a decryptable store of the family's logins — anyone holding
 * APP_KEY could read all of them.
 *
 * Passwords are now HASHED ONLY: bcrypt in password_hash, nothing else. The
 * admin can RESET a password but can never read one.
 *
 * Order matters: scrub the values FIRST, then drop the column, so no
 * encrypted copy survives even if the DROP fails halfway.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('members', 'password_secret')) {
            return;
        }

        // 1. Overwrite every stored copy in place.
        DB::table('members')->update(['password_secret' => null]);

        // 2. Then drop the column for good.
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn('password_secret');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('members', 'password_secret')) {
            return;
        }

        Schema::table('members', function (Blueprint $table) {
            $table->text('password_secret')->nullable()->after('password_hash');
        });
    }
};
