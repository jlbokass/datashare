<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateFileTagsRequest;
use App\Services\FileTags;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Throwable;

final class UpdateFileTagsController extends Controller
{
    /**
     * Replace the tags of one owned file.
     *
     * Requires the owner's Bearer JWT. The list may be empty to remove all tags.
     * Labels are trimmed, case-sensitive and unique per file (maximum 30 characters each).
     * Unknown or non-owned resources return 404. Tags are never public.
     */
    #[Group('Transfers', weight: 20)]
    #[Response(200, type: 'array{tags: list<string>}')]
    public function __invoke(UpdateFileTagsRequest $request, string $transferId, string $fileId, FileTags $fileTags): JsonResponse
    {
        try {
            $tags = $fileTags->replace($request->user(), $transferId, $fileId, $request->validated('tags'));
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Impossible de modifier les tags. Réessaie plus tard.',
                'code' => 'server_error',
            ], 500);
        }

        if ($tags === null) {
            return response()->json([
                'message' => 'Ce fichier est introuvable.',
                'code' => 'not_found',
            ], 404);
        }

        return response()->json(['tags' => $tags])->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
