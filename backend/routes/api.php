<?php

use App\Documentation\ClosureGroup;
use App\Http\Controllers\Api\CreateTransferController;
use App\Http\Controllers\Api\DeleteTransferFileController;
use App\Http\Controllers\Api\DownloadPublicShareFileController;
use App\Http\Controllers\Api\ListTransfersController;
use App\Http\Controllers\Api\LoginController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\ShowPublicShareController;
use App\Http\Controllers\Api\UpdateFileTagsController;
use App\Http\Controllers\Api\UpdateProfileController;
use App\Http\Middleware\AuthenticateJwt;
use Illuminate\Support\Facades\Route;

Route::get(
    '/health',
    /**
     * Check API availability.
     *
     * Public smoke check confirming that the API can handle a request. It does
     * not verify database connectivity, private storage or dependency readiness.
     */
    #[ClosureGroup('System', weight: 40)]
    fn () => response()->json(['status' => 'ok'])
);

// US03 registration is public and intentionally does not issue a JWT.
Route::post('/auth/register', RegisterController::class)->middleware('throttle:10,1');

// US04: login returns JWT, /me requires a valid bearer token.
Route::post('/auth/login', LoginController::class)->middleware('throttle:5,1');
Route::get('/auth/me', MeController::class)->middleware(AuthenticateJwt::class);
// PROFILE-01: authenticated account name and first name only.
Route::patch('/auth/me', UpdateProfileController::class)->middleware(AuthenticateJwt::class);

Route::get(
    '/demo/capabilities',
    /**
     * Read demonstration capabilities.
     *
     * Public capability discovery for clients. Five-minute expiry is advertised
     * only in the local environment with the demo feature explicitly enabled.
     * No credentials or private configuration are exposed.
     */
    #[ClosureGroup('System', weight: 40)]
    fn () => response()->json([
        'five_minute_expiry' => app()->environment('local')
            && (bool) config('transfers.demo_five_minutes', false),
    ])
);

// US01: authenticated private upload.
Route::post('/transfers', CreateTransferController::class)->middleware(AuthenticateJwt::class);

// US05: history belongs exclusively to the verified JWT owner.
Route::get('/transfers', ListTransfersController::class)->middleware(AuthenticateJwt::class);

// US06: owner-authorized individual file deletion.
Route::delete('/transfers/{transferId}/files/{fileId}', DeleteTransferFileController::class)
    ->middleware(AuthenticateJwt::class);

// US08: owner-authorized replacement of private file tags.
Route::put('/transfers/{transferId}/files/{fileId}/tags', UpdateFileTagsController::class)
    ->middleware(AuthenticateJwt::class);

// US02: public share metadata and file download, authorized by share token (no JWT).
Route::get('/shares/{token}', ShowPublicShareController::class)->middleware('throttle:60,1');
Route::get('/shares/{token}/files/{fileId}', DownloadPublicShareFileController::class)->middleware('throttle:60,1');
