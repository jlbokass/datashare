<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;

final class UpdateProfileController extends Controller
{
    /**
     * Update the authenticated account profile.
     *
     * Requires a Bearer JWT. Only name (family name) and first_name can be
     * updated. Omitted fields are unchanged; null clears a name. Email,
     * password, identifiers and any other fields cannot be modified here.
     */
    #[Group('Authentication', weight: 10)]
    #[Response(200, type: 'array{user: array{id: string, email: string, name: string|null, first_name: string|null, created_at: string}}')]
    public function __invoke(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'user' => [
                'id' => $user->public_id,
                'email' => $user->email,
                'name' => $user->name,
                'first_name' => $user->first_name,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
        ])->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
