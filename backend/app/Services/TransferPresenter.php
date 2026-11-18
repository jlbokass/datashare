<?php

namespace App\Services;

use App\Models\Transfer;

class TransferPresenter
{
    public static function toArray(Transfer $transfer): array
    {
        return [
            'id' => $transfer->id,
            // Relative Angular URL. The public download behavior is US02.
            'share_url' => '/share/'.$transfer->share_token,
            'created_at' => $transfer->created_at->toIso8601String(),
            'expires_at' => $transfer->expires_at->toIso8601String(),
            'status' => $transfer->expires_at->isPast() ? 'expired' : 'valid',
            'files' => $transfer->files->map(fn ($file) => [
                'id' => $file->id,
                'original_name' => $file->original_name,
                'size_bytes' => $file->size_bytes,
                'mime_type' => $file->mime_type,
                'uploaded_at' => $file->created_at->toIso8601String(),
            ])->values()->all(),
        ];
    }
}
