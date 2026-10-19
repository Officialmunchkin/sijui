<?php

use App\Http\Controllers\AlbumController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\PhotoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Famvault API routes
|--------------------------------------------------------------------------
|
| The React frontend (Vite on :5173) talks only to this API. Photo bytes
| live in Cloudflare R2 and are proxied through the famvault-r2 Worker —
| see config/famvault.php and App\Services\WorkerClient. There are no R2
| secrets anywhere in this codebase; the Worker keeps them server-side.
|
| The only system album is TRASH. There is no UNSORTED.
|
*/

// ---------------------------------------------------------------- HEALTH
Route::get('/health', fn () => response()->json([
    'ok' => true,
    'app' => 'famvault-api',
    'worker' => config('famvault.worker_url'),
    'time' => now()->toIso8601String(),
]));

// ------------------------------------------------- TEMP DIAG (remove me)
Route::get('/_diag', function (\Illuminate\Http\Request $request) {
    abort_unless(hash_equals('diag-7f3a91c2b6', (string) $request->query('k')), 404);

    $m = \App\Models\Member::query()->find('herman');
    $raw = $m?->password_secret;
    $key = (string) config('app.key');

    $out = [
        'env' => config('app.env'),
        'debug' => config('app.debug'),
        'cipher' => config('app.cipher'),
        'raw_type' => gettype($raw),
        'raw_len' => is_string($raw) ? strlen($raw) : null,
        'raw_md5' => is_string($raw) ? md5($raw) : null,
        'raw_head' => is_string($raw) ? substr($raw, 0, 12) : null,
        'key_len' => strlen($key),
        'key_prefix' => substr($key, 0, 7),
        'key_md5' => md5($key),
        'prev_keys' => config('app.previous_keys'),
    ];

    try {
        $d = \Illuminate\Support\Facades\Crypt::decryptString((string) $raw);
        $out['dec_ok'] = true;
        $out['dec_len'] = strlen($d);
        $out['dec_md5'] = md5($d);
    } catch (\Throwable $e) {
        $out['dec_ok'] = false;
        $out['exc'] = get_class($e).' :: '.$e->getMessage();
    }

    return response()->json($out);
});

// ---------------------------------------------------------------- AUTH
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/guest', [AuthController::class, 'guest']);

    Route::middleware('auth.famvault')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/password', [AuthController::class, 'setPassword']);
    });
});

// ---------------------------------------------------------------- MEMBERS
// The member grid is visible before login (same as the original app).
Route::get('/members', [MemberController::class, 'index']);

// Admin-only password viewer. Registered BEFORE /members/{id} so the literal
// "passwords" path isn't captured as an {id}. The admin check lives in the
// controller (denyNonAdmin).
Route::get('/members/passwords', [MemberController::class, 'passwords'])
    ->middleware('auth.famvault');

Route::get('/members/{id}', [MemberController::class, 'show']);

Route::middleware('auth.famvault')->group(function () {
    Route::post('/members', [MemberController::class, 'store']);
    Route::put('/members/{id}', [MemberController::class, 'update']);
    Route::patch('/members/{id}', [MemberController::class, 'update']);
    Route::delete('/members/{id}', [MemberController::class, 'destroy']);
    Route::post('/members/{id}/password', [MemberController::class, 'resetPassword']);
});

// ---------------------------------------------------------------- ALBUMS
Route::get('/albums', [AlbumController::class, 'index']);

Route::middleware('auth.famvault')->group(function () {
    Route::post('/albums', [AlbumController::class, 'store']);
    Route::put('/albums/{name}', [AlbumController::class, 'update'])->where('name', '.*');
    Route::patch('/albums/{name}', [AlbumController::class, 'update'])->where('name', '.*');
    Route::delete('/albums/{name}', [AlbumController::class, 'destroy'])->where('name', '.*');
});

// ---------------------------------------------------------------- PHOTOS
// Listing + file bytes are readable by guests; uploads/mutations require a
// member session (mirrors the Worker's own X-Famvault-Role gate). The trash
// LIST is admin-only (checked in PhotoController::trash).
Route::get('/photos', [PhotoController::class, 'index']);
Route::get('/photos/file/{key}', [PhotoController::class, 'file'])->where('key', '.*');

Route::middleware('auth.famvault')->group(function () {
    Route::get('/photos/trash', [PhotoController::class, 'trash']);           // admin-only
    Route::post('/photos/upload', [PhotoController::class, 'upload']);
    Route::post('/photos/trash', [PhotoController::class, 'updateTrash']);   // { ids, action: trash|restore }
    Route::post('/photos/move', [PhotoController::class, 'move']);           // { ids, album }
    Route::delete('/photos/trash/empty', [PhotoController::class, 'emptyTrash']);
    Route::delete('/photos/{id}', [PhotoController::class, 'destroy']);
});

// ---------------------------------------------------------------- BOARD
Route::get('/board', [BoardController::class, 'index']);

Route::middleware('auth.famvault')->group(function () {
    Route::post('/board', [BoardController::class, 'store']);
    Route::put('/board', [BoardController::class, 'sync']);
    Route::put('/board/{id}', [BoardController::class, 'update']);
    Route::delete('/board/{id}', [BoardController::class, 'destroy']);
});