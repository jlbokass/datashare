<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListTransfersRequest;
use App\Services\TransferHistory;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;

final class ListTransfersController extends Controller
{
    public function __construct(private readonly TransferHistory $history) {}

    /**
     * List own transfers.
     *
     * Requires a valid Bearer JWT. Only the authenticated owner's transfers are
     * returned, newest first, 10 transfers per page. The status filter (active, all,
     * expired) is applied before pagination. Without status, include_expired=true
     * includes expired records awaiting cleanup; otherwise only active records are
     * returned. Files of a transfer stay grouped. Purged records are never returned.
     */
    #[Group('Transfers', weight: 20)]
    #[Response(200, type: "array{transfers: list<array{id: string, share_url: string, created_at: string, expires_at: string, status: 'valid'|'expired', files: list<array{id: string, original_name: string, size_bytes: int, mime_type: string, uploaded_at: string, tags: list<string>}>}>, pagination: array{current_page: int, per_page: int, last_page: int, total: int}}")]
    public function __invoke(ListTransfersRequest $request): JsonResponse
    {
        $status = $request->validated('status') ?? ($request->boolean('include_expired') ? 'all' : 'active');

        return response()->json(
            $this->history->forUser($request->user(), $status, $request->integer('page', 1))
        )->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
