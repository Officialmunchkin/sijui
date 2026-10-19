<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/** A bearer-token API session (replaces the localStorage session object). */
class ApiSession extends Model
{
    protected $fillable = [
        'member_id',
        'token',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public static function issue(Member $member): self
    {
        return self::create([
            'member_id' => $member->id,
            'token' => Str::random(64),
            'expires_at' => now()->addDays(config('famvault.session_days', 30)),
        ]);
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id');
    }
}
