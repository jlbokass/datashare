<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TransferDeletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

final class DeleteTransferFileController extends Controller
{
    public function __construct(private readonly TransferDeletion $deletion) {}

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
