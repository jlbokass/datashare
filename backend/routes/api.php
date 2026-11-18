<?php

use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\LoginController;
use App\Http\Controllers\Api\MeController;
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
