<?php

use Illuminate\Support\Facades\Route;

// Infrastructure smoke test only. No business US or authentication yet.
// This endpoint does not validate PostgreSQL connectivity; migrations are
// tested independently in the local TECH-04 recipe.
Route::get('/health', fn () => response()->json(['status' => 'ok']));
