<?php

namespace Database\Seeders;

use App\Models\Album;
use App\Models\Member;
use Illuminate\Database\Seeder;

class FamvaultSeeder extends Seeder
{
    public function run(): void
    {
        $members = [
            ['id'=>'jermaine','name'=>'JERMAINE','relation'=>'FATHER','bio'=>'DAD. KEEPS THE FAMILY GROUNDED. LOVES FOOTY, BBQ, AND TELLING THE SAME STORY TWICE.','birthday'=>'05-12','color'=>'#6366F1','initial'=>'J','is_admin'=>false],
            ['id'=>'lucy','name'=>'LUCY','relation'=>'MOTHER','bio'=>'MUM. HEART OF THE HOUSE. KEEPS EVERYONE FED AND ON TIME.','birthday'=>'08-22','color'=>'#06B6D4','initial'=>'L','is_admin'=>false],
            ['id'=>'faith','name'=>'FAITH','relation'=>'1ST BORN','bio'=>'FIRST BORN. BIG SISTER ENERGY. ARTIST, ORGANIZER, SECRETLY IN CHARGE.','birthday'=>'02-14','color'=>'#EC4899','initial'=>'F','is_admin'=>false],
            ['id'=>'herman','name'=>'HERMAN','relation'=>'2ND BORN - ME','bio'=>'BUILDER OF THIS VAULT. CODE, PHOTOS, AND THE REMOTE CONTROL.','birthday'=>'11-03','color'=>'#F59E0B','initial'=>'H','is_admin'=>true],
            ['id'=>'hossam','name'=>'HOSSAM','relation'=>'3RD BORN','bio'=>'THIRD BORN. CHILL, FUNNY, GAMER. ALWAYS HAS THE AUX AND THE BEST MEMES.','birthday'=>'07-19','color'=>'#8B5CF6','initial'=>'H','is_admin'=>false],
            ['id'=>'amber','name'=>'AMBER','relation'=>'LAST BORN','bio'=>'LAST BORN. YOUNGEST BUT LOUDEST. DANCE, LAUGHS, AND STOLE EVERYONE\'S HOODIES.','birthday'=>'12-01','color'=>'#14B8A6','initial'=>'A','is_admin'=>false],
        ];

        foreach ($members as $m) {
            Member::updateOrCreate(['id' => $m['id']], $m + ['handle' => $m['id'], 'is_guest' => false]);
        }

        $albums = ['SUMMER 24', 'XMAS 23', 'BIRTHDAYS', 'WEEKENDS', 'FAMILY BBQ', 'ARCHIVE', 'UNSORTED'];
        foreach ($albums as $a) {
            Album::updateOrCreate(['name' => $a]);
        }
    }
}
