<?php

namespace App\Http\Controllers;

use App\Models\BoardPost;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The family board. The local DB is the single source of truth (no Worker
 * sync). Members may post; guests are rejected. Admins (or the author) may
 * edit/delete any post.
 */
class BoardController extends Controller
{
    /** GET /api/board */
    public function index(): JsonResponse
    {
        $posts = BoardPost::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (BoardPost $p) => $p->toClientArray());

        return response()->json(['posts' => $posts]);
    }

    /** POST /api/board — { text } — members only, guests rejected. */
    public function store(Request $request): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');

        if ($actor->is_guest) {
            return response()->json(['error' => 'GUESTS CANNOT POST ON BOARD'], 403);
        }

        $data = $request->validate([
            'text' => 'required|string|max:500',
        ]);

        $post = BoardPost::create([
            'member_id' => $actor->id,
            'user' => $actor->name,
            'text' => strtoupper(trim($data['text'])),
            'color' => $actor->color,
        ]);

        return response()->json(['ok' => true, 'post' => $post->toClientArray()], 201);
    }

    /** PUT /api/board/{id} — edit a post's text (admin, or author). */
    public function update(Request $request, int $id): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');
        $post = BoardPost::query()->find($id);

        if (! $post) {
            return response()->json(['error' => 'POST NOT FOUND'], 404);
        }

        if (! $actor->is_admin && $post->member_id !== $actor->id) {
            return response()->json(['error' => 'ONLY ADMIN OR AUTHOR CAN EDIT'], 403);
        }

        $data = $request->validate([
            'text' => 'required|string|max:500',
        ]);

        $post->update(['text' => strtoupper(trim($data['text']))]);

        return response()->json(['ok' => true, 'post' => $post->fresh()->toClientArray()]);
    }

    /** DELETE /api/board/{id} — admin, or author. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        /** @var Member $actor */
        $actor = $request->attributes->get('famvault_member');
        $post = BoardPost::query()->find($id);

        if (! $post) {
            return response()->json(['error' => 'POST NOT FOUND'], 404);
        }

        if (! $actor->is_admin && $post->member_id !== $actor->id) {
            return response()->json(['error' => 'ONLY ADMIN OR AUTHOR CAN DELETE'], 403);
        }

        $post->delete();

        return response()->json(['ok' => true]);
    }
}