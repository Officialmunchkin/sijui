<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'handle', 'relation', 'bio', 'birthday',
        'color', 'initial', 'is_admin', 'is_guest', 'password', 'token',
    ];

    protected $hidden = ['password', 'token'];

    protected $casts = [
        'is_admin' => 'boolean',
        'is_guest' => 'boolean',
    ];
}
