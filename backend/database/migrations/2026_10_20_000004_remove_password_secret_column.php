<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

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
 *
 * This migration deliberately uses RAW SQL instead of the Schema builder:
 * tursodatabase/turso-driver-laravel returns column defaults wrapped in a
 * Query\Expression (LibSQLSchemaBuilder::getColumns), and Laravel's
 * BlueprintState then calls Str::wrap() on that Expression —
 * "Object of class Illuminate\Database\Query\Expression could not be
 * converted to string" — which fataled `Schema::hasColumn` /
 * `Schema::table(... dropColumn ...)` against Turso (deploy dep-dbbij0bm8hqs738vmpgg).
 * Raw ALTER TABLE on this connection is proven: the three tables created by
 * the migrations above went through the same Connection::statement() path,
 * and raw DROP COLUMN was verified against Turso directly.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! $this->hasPasswordSecret()) {
            return;
        }

        // 1. Overwrite every stored copy in place.
        DB::statement('UPDATE members SET password_secret = null');

        // 2. Then drop the column for good.
        DB::statement('ALTER TABLE members DROP COLUMN password_secret');
    }

    public function down(): void
    {
        if ($this->hasPasswordSecret()) {
            return;
        }

        DB::statement('ALTER TABLE members ADD COLUMN password_secret TEXT NULL');
    }

    /**
     * Read the live column list straight from SQLite's table-valued pragma.
     *
     * Verified against Turso: returns the members column names as rows and
     * never touches the driver's Expression-wrapping schema builder.
     */
    private function hasPasswordSecret(): bool
    {
        foreach (DB::select("SELECT name FROM pragma_table_info('members')") as $column) {
            if (strtolower((string) $column->name) === 'password_secret') {
                return true;
            }
        }

        return false;
    }
};
