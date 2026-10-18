<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\BoardPost;
use Illuminate\Http\Request;

class AlbumController extends Controller
{
    public function index()
    {
        return response()->json(['albums' => Album::orderBy('name')->pluck('name')->values()]);
    }

    public function store(Request $request)
    {
        $name = strtoupper(trim((string) $request->input('name', '')));
        if ($name === '') return response()->json(['error' => 'NAME REQUIRED'], 422);
        if (Album::where('name', $name)->exists()) return response()->json(['error' => 'ALBUM EXISTS'], 409);
        $a = Album::create(['name' => $name]);
        return response()->json(['album' => $a->name]);
    }

    public function update(Request $request, $old)
    {
        $next = strtoupper(trim((string) $request->input('name', '')));
        if ($next === '') return response()->json(['error' => 'NAME REQUIRED'], 422);
        $a = Album::where('name', $old)->firstOrFail();
        if ($next !== $old && Album::where('name', $next)->exists()) return response()->json(['error' => 'ALBUM EXISTS'], 409);
        $a->name = $next;
        $a->save();
        return response()->json(['album' => $a->name]);
    }

    public function destroy($name)
    {
        $a = Album::where('name', $name)->first();
        if ($a) $a->delete();
        return response()->json(['ok' => true]);
    }
}
