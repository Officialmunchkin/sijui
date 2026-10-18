<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoardPost extends Model
{
    use HasFactory;

    protected $fillable = ['post_id', 'user', 'text', 'color', 'at'];

    public function toApiArray(): array
    {
        return [
            'id' => $this->post_id,
            'user' => $this->user,
            'text' => $this->text,
            'color' => $this->color,
            'at' => $this->at,
        ];
    }
}
