<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\AlbumController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\AuthController;

Route::get('/photos', [PhotoController::class, 'index']);
Route::get('/photos/trash', [PhotoController::class, 'trash']);
Route::post('/upload', [PhotoController::class, 'upload']);
Route::get('/file/{key}', [PhotoController::class, 'file'])->where('key', '.*');
Route::delete('/photos/{id}', [PhotoController::class, 'destroy']);
Route::post('/photos/trash', [PhotoController::class, 'trashAction']);
Route::post('/photos/update-album', [PhotoController::class, 'updateAlbum']);

Route::get('/members', [MemberController::class, 'index']);
Route::post('/members', [MemberController::class, 'store']);
Route::put('/members/{id}', [MemberController::class, 'update']);
Route::delete('/members/{id}', [MemberController::class, 'destroy']);
Route::put('/members/{id}/password', [MemberController::class, 'setPassword']);

Route::get('/albums', [AlbumController::class, 'index']);
Route::post('/albums', [AlbumController::class, 'store']);
Route::put('/albums/{old}', [AlbumController::class, 'update']);
Route::delete('/albums/{name}', [AlbumController::class, 'destroy']);

Route::get('/board', [BoardController::class, 'index']);
Route::post('/board', [BoardController::class, 'store']);

Route::post('/login', [AuthController::class, 'login']);
Route::post('/guest', [AuthController::class, 'guest']);
