<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TransferHistory;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ListTransfersController extends Controller
{
    public function __construct(private readonly TransferHistory $history) {}

    /**
     * List own transfers.
     *
     * Requires a valid Bearer JWT. Only the authenticated owner's transfers are
     * returned, newest first, without pagination. Expired transfers are excluded by
     * default; include_expired also includes those still awaiting cleanup, never
     * records that have already been purged.
     */
    #[Group('Transfers', weight: 20)]
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json([
            'transfers' => $this->history->forUser($request->user(), $request->boolean('include_expired')),
        ])->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
