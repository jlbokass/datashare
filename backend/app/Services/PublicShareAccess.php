<?php

namespace App\Services;

use App\Models\Transfer;
use Illuminate\Http\JsonResponse;

class PublicShareAccess
{
    public function resolve(string $token): Transfer|JsonResponse
    {
        // Only the 32-byte random, lowercase hex token generated at upload
        // may identify a public share; never confuse it with a login JWT.
        if (preg_match('/\A[a-f0-9]{64}\z/D', $token) !== 1) {
            return $this->notFound();
        }

        $transfer = Transfer::query()
            ->with('files')
            ->where('share_token', $token)
            ->first();

        if ($transfer === null) {
            return $this->notFound();
        }

        // A share is inaccessible immediately after expiry, independently of
        // when the scheduled physical/metadata purge executes.
        if ($transfer->expires_at->isPast()) {
            return response()->json([
                'message' => 'Ce lien de partage a expiré.',
                'code' => 'share_expired',
            ], 410)->header('Cache-Control', 'private, no-store, max-age=0');
        }

        return $transfer;
    }

    public function notFound(): JsonResponse
    {
        return response()->json([
            'message' => 'Ce lien ou ce fichier est introuvable.',
            'code' => 'not_found',
        ], 404)->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
