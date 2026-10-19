<?php

namespace App\Http\Controllers;

use App\Models\Album;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlbumController extends Controller
{
    /** GET /api/albums */
    public function index(): JsonResponse
    {
        $albums = Album::query()->orderBy('id')->pluck('name');

        return response()->json(['albums' => $albums]);
    }

    /** POST /api/albums — admin only. */
    public function store(Request $request): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if (! $actor->is_admin) {
            return response()->json(['error' => 'ADMIN ONLY'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:60',
        ]);

        $name = strtoupper(trim($data['name']));

        if ($name === 'TRASH') {
            return response()->json(['error' => 'TRASH IS RESERVED'], 422);
        }

        $album = Album::firstOrCreate(['name' => $name], ['created_by' => $actor->id]);

        return response()->json(['ok' => true, 'album' => $album->name], 201);
    }

    /**
     * PUT /api/albums/{name} — rename.
     *
     * Albums are keyed by name (the frontend uses names as identifiers).
     */
    public function update(Request $request, string $name): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if (! $actor->is_admin) {
            return response()->json(['error' => 'ADMIN ONLY'], 403);
        }

        $album = Album::query()->where('name', $name)->first();

        if (! $album) {
            return response()->json(['error' => 'ALBUM NOT FOUND'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|max:60',
        ]);

        $new = strtoupper(trim($data['name']));

        if ($new === 'TRASH') {
            return response()->json(['error' => 'TRASH IS RESERVED'], 422);
        }

        if ($new !== $album->name && Album::query()->where('name', $new)->exists()) {
            return response()->json(['error' => 'ALBUM EXISTS'], 422);
        }

        $old = $album->name;
        $album->update(['name' => $new]);

        // Keep photo album labels in sync locally (the local DB is the source
        // of truth for album assignment; the Worker only stores file bytes).
        \App\Models\Photo::query()->where('album', $old)->update(['album' => $new]);

        return response()->json(['ok' => true, 'album' => $new]);
    }

    /**
     * DELETE /api/albums/{name} — admin only.
     *
     * Deleting an album sends its photos STRAIGHT TO TRASH (not UNSORTED):
     * each photo records original_album + trashed_at so RESTORE can put it
     * back if the album returns. TRASH itself can never be deleted.
     */
    public function destroy(Request $request, string $name): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if (! $actor->is_admin) {
            return response()->json(['error' => 'ADMIN ONLY'], 403);
        }

        $album = Album::query()->where('name', $name)->first();

        if (! $album) {
            return response()->json(['error' => 'ALBUM NOT FOUND'], 404);
        }

        if (strtoupper($album->name) === 'TRASH') {
            return response()->json(['error' => 'TRASH CANNOT BE DELETED'], 403);
        }

        $name = $album->name;

        \App\Models\Photo::query()
            ->where('album', $name)
            ->update([
                'trashed' => true,
                'original_album' => $name,
                'trashed_at' => now(),
            ]);

        $album->delete();

        return response()->json(['ok' => true]);
    }
}
