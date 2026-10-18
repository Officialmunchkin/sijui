<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'key', 'caption', 'album', 'uploaded_by', 'tagged',
        'type', 'size', 'likes', 'date', 'trashed', 'original_album', 'trashed_at',
    ];

    protected $casts = [
        'tagged' => 'array',
        'trashed' => 'boolean',
        'trashed_at' => 'datetime',
    ];

    /** Shape matching what the frontend expects from the R2 Worker. */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'src' => $this->key ? url('/api/file/' . $this->key) : null,
            'caption' => $this->caption,
            'album' => $this->album,
            'uploadedBy' => $this->uploaded_by,
            'tagged' => $this->tagged ?: [],
            'type' => $this->type,
            'size' => $this->size,
            'likes' => $this->likes,
            'date' => $this->date,
        ];
    }
}
