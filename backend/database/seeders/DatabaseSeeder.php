<?php

namespace Database\Seeders;

use App\Models\Album;
use App\Models\Member;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the family exactly as the original app did (SEED_MEMBERS /
     * SEED_ALBUMS / board seed from kashifamily.html). Idempotent: existing
     * rows are left untouched so re-seeding never clobbers real passwords.
     */
    public function run(): void
    {
        $members = [
            [
                'id' => 'jermaine', 'name' => 'JERMAINE', 'handle' => 'jermaine',
                'relation' => 'FATHER', 'bio' => 'DAD. KEEPS THE FAMILY GROUNDED. LOVES FOOTY, BBQ, AND TELLING THE SAME STORY TWICE.',
                'birthday' => '05-12', 'color' => '#6366F1', 'initial' => 'J',
                'is_admin' => false, 'is_guest' => false,
            ],
            [
                'id' => 'lucy', 'name' => 'LUCY', 'handle' => 'lucy',
                'relation' => 'MOTHER', 'bio' => 'MUM. HEART OF THE HOUSE. KEEPS EVERYONE FED AND ON TIME.',
                'birthday' => '08-22', 'color' => '#06B6D4', 'initial' => 'L',
                'is_admin' => false, 'is_guest' => false,
            ],
            [
                'id' => 'faith', 'name' => 'FAITH', 'handle' => 'faith',
                'relation' => '1ST BORN', 'bio' => 'FIRST BORN. BIG SISTER ENERGY. ARTIST, ORGANIZER, SECRETLY IN CHARGE.',
                'birthday' => '02-14', 'color' => '#EC4899', 'initial' => 'F',
                'is_admin' => false, 'is_guest' => false,
            ],
            [
                'id' => 'herman', 'name' => 'HERMAN', 'handle' => 'herman',
                'relation' => '2ND BORN - ME', 'bio' => 'BUILDER OF THIS VAULT. CODE, PHOTOS, AND THE REMOTE CONTROL.',
                'birthday' => '11-03', 'color' => '#F59E0B', 'initial' => 'H',
                'is_admin' => true, 'is_guest' => false,   // ADMIN_ID in the original app
            ],
            [
                'id' => 'hossam', 'name' => 'HOSSAM', 'handle' => 'hossam',
                'relation' => '3RD BORN', 'bio' => 'THIRD BORN. CHILL, FUNNY, GAMER. ALWAYS HAS THE AUX AND THE BEST MEMES.',
                'birthday' => '07-19', 'color' => '#8B5CF6', 'initial' => 'H',
                'is_admin' => false, 'is_guest' => false,
            ],
            [
                'id' => 'amber', 'name' => 'AMBER', 'handle' => 'amber',
                'relation' => 'LAST BORN', 'bio' => "LAST BORN. YOUNGEST BUT LOUDEST. DANCE, LAUGHS, AND STOLE EVERYONE'S HOODIES.",
                'birthday' => '12-01', 'color' => '#14B8A6', 'initial' => 'A',
                'is_admin' => false, 'is_guest' => false,
            ],
        ];

        foreach ($members as $m) {
            Member::firstOrCreate(['id' => $m['id']], $m);
        }

        foreach (['SUMMER 24', 'XMAS 23', 'BIRTHDAYS', 'WEEKENDS', 'FAMILY BBQ', 'ARCHIVE'] as $album) {
            Album::firstOrCreate(['name' => $album]);
        }

        // Fresh start: no board posts (spec — 0 photos, 0 trash, 0 board posts).
    }
}
