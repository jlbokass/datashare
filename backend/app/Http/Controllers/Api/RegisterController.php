<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // Canonicalize email so a different letter case cannot create duplicates.
        if (is_string($request->input('email'))) {
            $request->merge(['email' => mb_strtolower(trim($request->input('email')))]);
        }

        $data = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
        ]);

        // Laravel's 'hashed' model cast performs salted password hashing.
        $user = User::create($data);

        return response()->json([
            'user' => [
                'id' => $user->public_id,
                'email' => $user->email,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
        ], 201);
    }
}
