<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TransferHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ListTransfersController extends Controller
{
    public function __construct(private readonly TransferHistory $history) {}

    public function __invoke(Request $request): JsonResponse
    {
        return response()->json([
            'transfers' => $this->history->forUser($request->user(), $request->boolean('include_expired')),
        ])->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
