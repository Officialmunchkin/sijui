<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A photo's metadata mirror. The file bytes live in R2 (via the Worker);
 * this table only tracks local state the Worker doesn't own — most
 * importantly trash, which the original app kept in localStorage.
 */
class Photo extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'key',
        'src',
        'type',
        'album',
        'uploaded_by',
        'tagged',
        'caption',
        'photo_date',
        'likes',
        'size',
        'file_name',
        'trashed',
        'original_album',
        'trashed_at',
    ];

    protected $casts = [
        'tagged' => 'array',
        'trashed' => 'boolean',
        'trashed_at' => 'datetime',
    ];

    /** Worker metadata shape (what GET /photos returns). */
    public function toClientArray(): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'src' => $this->src,
            'type' => $this->type,
            'album' => $this->album,
            'uploadedBy' => $this->uploaded_by,
            'tagged' => $this->tagged ?? [],
            'caption' => $this->caption,
            'date' => $this->photo_date,
            'likes' => $this->likes ?? 0,
            'size' => $this->size ?? 0,
            'fileName' => $this->file_name,
        ];
    }
}
