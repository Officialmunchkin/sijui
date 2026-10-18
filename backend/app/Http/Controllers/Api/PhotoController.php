<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PhotoController extends Controller
{
    /** GET /api/photos — list non-trashed photos (newest first). */
    public function index()
    {
        $photos = Photo::where('trashed', false)
            ->orderByDesc('created_at')
            ->get()
            ->map->toApiArray();

        return response()->json(['photos' => $photos]);
    }

    /** GET /api/photos/trash — list trashed photos. */
    public function trash()
    {
        $photos = Photo::where('trashed', true)
            ->orderByDesc('trashed_at')
            ->get()
            ->map(function ($p) {
                $arr = $p->toApiArray();
                $arr['originalAlbum'] = $p->original_album;
                return $arr;
            });

        return response()->json(['photos' => $photos]);
    }

    /** POST /api/upload — store an uploaded file + record. */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:102400', // 100 MB
        ]);

        $file = $request->file('file');
        $isVideo = str_starts_with($file->getMimeType(), 'video/');
        $ext = $file->getClientOriginalExtension() ?: ($isVideo ? 'mp4' : 'jpg');
        $id = (string) Str::uuid();
        $key = 'photos/' . $id . '.' . $ext;

        Storage::disk('local')->put($key, file_get_contents($file->getRealPath()));

        $photo = Photo::create([
            'id' => $id,
            'key' => $key,
            'caption' => $request->input('caption', ''),
            'album' => strtoupper($request->input('album', 'UNSORTED')),
            'uploaded_by' => $request->input('uploadedBy'),
            'tagged' => array_values(array_filter(explode(',', (string) $request->input('tagged', '')))),
            'type' => $isVideo ? 'video' : 'image',
            'size' => $file->getSize(),
            'likes' => 0,
            'date' => now()->format('Y-m-d'),
        ]);

        return response()->json(['photo' => $photo->toApiArray()]);
    }

    /** GET /api/file/{key} — stream a stored file. */
    public function file($key)
    {
        $path = trim($key, '/');
        if (!Storage::disk('local')->exists($path)) {
            return response()->json(['error' => 'NOT FOUND'], 404);
        }
        return response()->streamDownload(function () use ($path) {
            echo Storage::disk('local')->get($path);
        }, '', [
            'Content-Type' => $this->mimeFor($path),
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    /** DELETE /api/photos/{id} — permanently delete a photo + file. */
    public function destroy($id)
    {
        $photo = Photo::find($id);
        if (!$photo) {
            // fall back to delete-by-key semantics
            return response()->json(['error' => 'PHOTO NOT FOUND'], 404);
        }
        if ($photo->key && Storage::disk('local')->exists($photo->key)) {
            Storage::disk('local')->delete($photo->key);
        }
        $photo->delete();
        return response()->json(['ok' => true]);
    }

    /** POST /api/photos/trash — trash or restore a set of ids. */
    public function trashAction(Request $request)
    {
        $ids = $request->input('ids', []);
        $action = $request->input('action', 'trash');

        $photos = Photo::whereIn('id', $ids)->get();
        foreach ($photos as $p) {
            if ($action === 'restore') {
                $p->trashed = false;
                $p->original_album = null;
                $p->trashed_at = null;
            } else {
                if (!$p->trashed) {
                    $p->original_album = $p->album;
                }
                $p->trashed = true;
                $p->trashed_at = now();
            }
            $p->save();
        }
        return response()->json(['ok' => true]);
    }

    /** POST /api/photos/update-album — reassign photos from one album to another. */
    public function updateAlbum(Request $request)
    {
        $from = $request->input('from');
        $to = $request->input('to', 'UNSORTED');
        Photo::where('album', $from)->update(['album' => strtoupper($to)]);
        return response()->json(['ok' => true]);
    }

    private function mimeFor(string $path): string
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return match ($ext) {
            'mp4', 'm4v', 'mov' => 'video/mp4',
            'webm' => 'video/webm',
            'gif' => 'image/gif',
            'png' => 'image/png',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };
    }
}
