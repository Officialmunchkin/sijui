<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BoardPost;
use Illuminate\Http\Request;

class BoardController extends Controller
{
    public function index()
    {
        $posts = BoardPost::orderByDesc('id')->get()->map->toApiArray()->values();
        return response()->json(['posts' => $posts]);
    }

    public function store(Request $request)
    {
        $posts = $request->input('posts', []);
        if (!is_array($posts)) $posts = [];
        // Replace all
        BoardPost::truncate();
        foreach ($posts as $p) {
            BoardPost::create([
                'post_id' => $p['id'] ?? 'p_' . uniqid(),
                'user' => strtoupper((string) ($p['user'] ?? '')),
                'text' => strtoupper((string) ($p['text'] ?? '')),
                'color' => $p['color'] ?? null,
                'at' => $p['at'] ?? 0,
            ]);
        }
        return response()->json(['ok' => true]);
    }
}
