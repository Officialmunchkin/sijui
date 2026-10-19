<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** An album name (the original app stored a plain string array). */
class Album extends Model
{
    protected $fillable = [
        'name',
        'created_by',
    ];
}
