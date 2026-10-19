<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A post on the shared family board. */
class BoardPost extends Model
{
    protected $fillable = [
        'member_id',
        'user',
        'text',
        'color',
    ];

    /** Shape used by the original board UI. */
    public function toClientArray(): array
    {
        return [
            'id' => $this->id,
            'member_id' => $this->member_id,
            'user' => $this->user,
            'text' => $this->text,
            'color' => $this->color,
            'at' => $this->created_at?->getTimestamp() * 1000,
        ];
    }
}
