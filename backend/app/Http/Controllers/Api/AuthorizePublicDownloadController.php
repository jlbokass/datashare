<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthorizeDownloadRequest;
use App\Services\PublicShareAccess;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

final class AuthorizePublicDownloadController extends Controller
{
    /**
     * Authorize a password-protected download.
     *
     * No JWT is required. Verify the share, expiration, file membership and
     * password. Return a relative signed download URL valid for 60 seconds.
     * The password is submitted in the JSON body, never in a URL.
     * Attempts are limited to five per minute per client IP.
     */
    #[Group('Public sharing', weight: 30)]
    #[Response(200, type: 'array{download_url: string}')]
    public function __invoke(AuthorizeDownloadRequest $request, string $token, string $fileId, PublicShareAccess $access): JsonResponse
    {
        $transfer = $access->resolve($token);

        if ($transfer instanceof JsonResponse) {
            return $transfer;
        }

        if (! Str::isUuid($fileId)) {
            return $access->notFound();
        }

        $file = $transfer->files->firstWhere('id', $fileId);
        if ($file === null || ! Storage::disk('transfers')->exists($file->storage_path)) {
            return $access->notFound();
        }

        if ($file->password_hash === null || ! Hash::check($request->validated('password'), $file->password_hash)) {
            return response()->json([
                'message' => 'Mot de passe incorrect.',
                'code' => 'invalid_password',
            ], 403)->header('Cache-Control', 'private, no-store, max-age=0');
        }

        return response()->json([
            'download_url' => URL::temporarySignedRoute(
                'shares.download',
                now()->addMinute(),
                ['token' => $token, 'fileId' => $fileId],
                absolute: false,
            ),
        ])->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
