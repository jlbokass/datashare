<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;
use Dedoc\Scramble\Scramble;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Documentation is available only when development dependencies are installed.
if (class_exists(Scramble::class)) {
    Route::view('/docs/api', 'docs.api')
        ->middleware(RestrictedDocsAccess::class)
        ->name('docs.api');
}
