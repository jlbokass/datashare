<?php

use App\Http\Controllers\Api\CreateTransferController;
use App\Http\Controllers\Api\DownloadPublicShareFileController;
use App\Http\Controllers\Api\LoginController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\ShowPublicShareController;
use App\Http\Middleware\AuthenticateJwt;
use Illuminate\Support\Facades\Route;

// Infrastructure smoke test only. No business US or authentication yet.
// This endpoint does not validate PostgreSQL connectivity; migrations are
// tested independently in the local TECH-04 recipe.
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// US03 registration is public and intentionally does not issue a JWT.
Route::post('/auth/register', RegisterController::class)->middleware('throttle:10,1');

// US04: login returns JWT, /me requires a valid bearer token.
Route::post('/auth/login', LoginController::class)->middleware('throttle:5,1');
Route::get('/auth/me', MeController::class)->middleware(AuthenticateJwt::class);

// Public, non-sensitive capability flags: Angular only offers demo expiry when enabled.
Route::get('/demo/capabilities', fn () => response()->json([
    'five_minute_expiry' => app()->environment('local')
        && (bool) config('transfers.demo_five_minutes', false),
]));

// US01: authenticated private upload.
Route::post('/transfers', CreateTransferController::class)->middleware(AuthenticateJwt::class);

// US02: public share metadata and file download, authorized by share token (no JWT).
Route::get('/shares/{token}', ShowPublicShareController::class)->middleware('throttle:60,1');
Route::get('/shares/{token}/files/{fileId}', DownloadPublicShareFileController::class)->middleware('throttle:60,1');
