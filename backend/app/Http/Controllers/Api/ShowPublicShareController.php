<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PublicShareAccess;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;

class ShowPublicShareController extends Controller
{
    /**
     * Read share metadata.
     *
     * No JWT is required. The share token grants access only while the transfer is
     * unexpired. Owner details and private storage locations are never included.
     * Only a boolean password_protected is exposed, never the password or hash.
     * An expired share returns 410 while awaiting cleanup, then 404 after removal.
     */
    #[Group('Public sharing', weight: 30)]
    #[Response(200, type: 'array{share: array{expires_at: string, files: list<array{id: string, original_name: string, mime_type: string, size_bytes: int, uploaded_at: string, password_protected: bool}>}}')]
    public function __invoke(string $token, PublicShareAccess $access): JsonResponse
    {
        $transfer = $access->resolve($token);

        if ($transfer instanceof JsonResponse) {
            return $transfer;
        }

        return response()->json([
            'share' => [
                'expires_at' => $transfer->expires_at->toIso8601String(),
                'files' => $transfer->files->map(fn ($file): array => [
                    'id' => $file->id,
                    'original_name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size_bytes' => $file->size_bytes,
                    'uploaded_at' => $file->created_at->toIso8601String(),
                    'password_protected' => $file->password_hash !== null,
                ])->values()->all(),
            ],
        ])->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
