<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One allowed viewer of one restricted photo (Selective Sharing).
 *
 * A photo with NO rows here is public to the whole family — rows only exist
 * to narrow visibility. See PhotoController::index for the filter.
 */
class MediaVisibility extends Model
{
    public $timestamps = false;

    /**
     * Explicit table name. Eloquent would guess "media_visibilities" from the
     * class name (it pluralizes and "visibility" -> "visibilities"), which
     * does not match the migration's "media_visibility".
     */
    protected $table = 'media_visibility';

    protected $fillable = [
        'media_id',
        'allowed_viewer_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
