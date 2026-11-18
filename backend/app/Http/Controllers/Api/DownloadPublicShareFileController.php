<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PublicShareAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DownloadPublicShareFileController extends Controller
{
    public function __invoke(string $token, string $fileId, PublicShareAccess $access): StreamedResponse|JsonResponse
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

        // Force all formats, including images and ZIP, to be downloaded
        // as attachments. The server never unpacks or executes uploaded data.
        $name = basename(str_replace('\\', '/', $file->original_name));
        $name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?: 'download';

        return Storage::disk('transfers')->download($file->storage_path, $name, [
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }
}
