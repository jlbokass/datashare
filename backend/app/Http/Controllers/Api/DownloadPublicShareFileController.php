<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PublicShareAccess;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DownloadPublicShareFileController extends Controller
{
    /**
     * Download a shared file.
     *
     * No JWT is required. A valid, unexpired share token is required, and the file
     * must belong to that share. Bytes are streamed as an attachment, never previewed
     * or executed. Missing content and files outside the share return 404; an expired
     * share returns 410 until cleanup removes it.
     */
    #[Group('Public sharing', weight: 30)]
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
