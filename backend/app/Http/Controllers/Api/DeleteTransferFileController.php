<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TransferDeletion;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

final class DeleteTransferFileController extends Controller
{
    public function __construct(private readonly TransferDeletion $deletion) {}

    /**
     * Delete a transfer file.
     *
     * Requires the owner's Bearer JWT. Deletes only the selected file; other files
     * in the transfer remain available. Deleting the last file also removes the
     * transfer and revokes its share link. Missing resources and resources owned
     * by another account return the same not-found response.
     */
    #[Group('Transfers', weight: 20)]
    public function __invoke(Request $request, string $transferId, string $fileId): Response|JsonResponse
    {
        try {
            $deleted = $this->deletion->deleteFile($request->user(), $transferId, $fileId);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Impossible de supprimer ce fichier. Réessaie plus tard.',
                'code' => 'server_error',
            ], 500);
        }

        if (! $deleted) {
            return response()->json([
                'message' => 'Ce fichier est introuvable.',
                'code' => 'not_found',
            ], 404);
        }

        return response()->noContent();
    }
}
