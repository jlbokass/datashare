<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PublicShareAccess;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
     * share returns 410 until cleanup removes it. Protected files additionally
     * require a valid, short-lived relative signature obtained through POST /authorize.
     */
    #[Group('Public sharing', weight: 30)]
    #[QueryParameter('expires', description: 'Expiration timestamp from the signed URL, required for protected files only.', required: false, type: 'int')]
    #[QueryParameter('signature', description: 'Signature from the authorization response, required for protected files only.', required: false, type: 'string')]
    public function __invoke(Request $request, string $token, string $fileId, PublicShareAccess $access): StreamedResponse|JsonResponse
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

        if ($file->password_hash !== null && ! $request->hasValidSignature(false)) {
            return response()->json([
                'message' => 'Un mot de passe est requis pour télécharger ce fichier.',
                'code' => 'password_required',
            ], 403)->header('Cache-Control', 'private, no-store, max-age=0');
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
