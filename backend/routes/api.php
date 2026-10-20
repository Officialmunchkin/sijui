<?php

use App\Http\Controllers\AlbumController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\SecretAlbumController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ---------------------------------------------------------------- CORS PREFLIGHT
// Ensure OPTIONS requests always get CORS headers even if the app crashes
// before middleware (common on Render cold starts returning 502).
Route::options('{any}', function (Request $request) {
    $origin = $request->headers->get('Origin');
    $allowed = [
        'https://kashifamily.netlify.app',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'https://famvault-r2.famvault.workers.dev',
    ];
    if ($origin && preg_match('#^https://[a-z0-9-]+(\.[a-z0-9-]+)*\.netlify\.app$#i', $origin)) {
        $allowed[] = $origin;
    }
    $allowOrigin = in_array($origin, $allowed, true) ? $origin : 'https://kashifamily.netlify.app';

    return response('', 204)->withHeaders([
        'Access-Control-Allow-Origin' => $allowOrigin,
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Famvault-Token',
        'Access-Control-Allow-Credentials' => 'false',
        'Access-Control-Max-Age' => '86400',
        'Vary' => 'Origin',
    ]);
})->where('any', '.*');

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

// ---------------------------------------------------------------- AUTH
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/guest', [AuthController::class, 'guest']);

    Route::middleware('auth.famvault')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/password', [AuthController::class, 'setPassword']);
        // Member self-service change: verify old, hash new, revoke other
        // sessions. Identity comes from the token, never the body.
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

// ---------------------------------------------------------------- MEMBERS
// The member grid is visible before login (same as the original app).
Route::get('/members', [MemberController::class, 'index']);

Route::get('/members/{id}', [MemberController::class, 'show']);

Route::middleware('auth.famvault')->group(function () {
    Route::post('/members', [MemberController::class, 'store']);
    Route::put('/members/{id}', [MemberController::class, 'update']);
    Route::patch('/members/{id}', [MemberController::class, 'update']);
    Route::delete('/members/{id}', [MemberController::class, 'destroy']);
    Route::post('/members/{id}/password', [MemberController::class, 'resetPassword']);
});

// ---------------------------------------------------------------- ADMIN
// Password management. Admin can RESET a password but can never read one:
// passwords are bcrypt-hashed on arrival and nothing on this server can
// turn a hash back into the original. Every reset writes an audit line
// (who / whose / when — never the value).
//
// The old GET /members/passwords viewer is gone, along with the
// members.password_secret column it depended on.
Route::middleware('auth.famvault')->prefix('admin')->group(function () {
    Route::get('/users', [MemberController::class, 'adminUsers']);
    Route::post('/users/{id}/reset-password', [MemberController::class, 'adminResetPassword']);
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
    Route::post('/photos/upload', [PhotoController::class, 'upload']);        // accepts allowed_viewers
    Route::post('/photos/trash', [PhotoController::class, 'updateTrash']);   // { ids, action: trash|restore }
    Route::post('/photos/move', [PhotoController::class, 'move']);           // { ids, album }
    Route::delete('/photos/trash/empty', [PhotoController::class, 'emptyTrash']);
    Route::delete('/photos/{id}', [PhotoController::class, 'destroy']);
    // Change your mind about who can see a photo. Uploader only (the admin
    // is bound by the same rule as everyone else). Empty list = public.
    Route::put('/photos/{id}/visibility', [PhotoController::class, 'setVisibility']);
    Route::patch('/photos/{id}/visibility', [PhotoController::class, 'setVisibility']);
});

// --------------------------------------------------------- SECRET ALBUMS
// End-to-end encrypted, admin-blind. The server holds ciphertext, a name
// and a salt — never a password, never a key, never a plaintext URL or
// file name. Ownership is checked on every route INCLUDING the byte
// stream, and there is deliberately no is_admin escape hatch anywhere in
// SecretAlbumController, so the admin gets 403 exactly like any other
// non-owner. See that controller for the full threat model.
Route::middleware('auth.famvault')->group(function () {
    Route::post('/secret-albums/create', [SecretAlbumController::class, 'createAlbum']);
    Route::get('/secret-albums', [SecretAlbumController::class, 'indexAlbums']);
    Route::get('/secret-albums/{id}/media', [SecretAlbumController::class, 'listMedia']);
    Route::delete('/secret-albums/{id}', [SecretAlbumController::class, 'destroyAlbum']);

    Route::post('/secret-media/upload', [SecretAlbumController::class, 'upload']);   // ciphertext only
    Route::get('/secret-media/file/{id}', [SecretAlbumController::class, 'file']);   // owner-only bytes
    Route::delete('/secret-media/{id}', [SecretAlbumController::class, 'destroyMedia']);
});

// ---------------------------------------------------------------- BOARD
Route::get('/board', [BoardController::class, 'index']);

Route::middleware('auth.famvault')->group(function () {
    Route::post('/board', [BoardController::class, 'store']);
    Route::put('/board', [BoardController::class, 'sync']);
    Route::put('/board/{id}', [BoardController::class, 'update']);
    Route::delete('/board/{id}', [BoardController::class, 'destroy']);
});