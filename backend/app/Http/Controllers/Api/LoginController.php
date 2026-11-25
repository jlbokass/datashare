<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JwtService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    /**
     * Obtain an access token.
     *
     * Public endpoint. Valid credentials issue a Bearer JWT for owner operations.
     * Invalid credentials receive the same generic error whether or not the account
     * exists. This JWT is separate from the capability token in a public share link.
     */
    #[Group('Authentication', weight: 10)]
    public function __invoke(Request $request, JwtService $jwt): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'L’adresse email est obligatoire.',
            'email.email' => 'Saisis une adresse email valide.',
            'email.max' => 'L’adresse email ne doit pas dépasser 255 caractères.',
            'password.required' => 'Le mot de passe est obligatoire.',
        ]);

        $email = mb_strtolower(trim($data['email']));
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            // Keep a generic message: do not reveal whether the account exists.
            return response()->json([
                'message' => 'Email ou mot de passe incorrect.',
                'code' => 'unauthenticated',
            ], 401);
        }

        return response()->json([
            'access_token' => $jwt->issue($user),
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->public_id,
                'email' => $user->email,
                'name' => $user->name,
                'first_name' => $user->first_name,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
        ]);
    }
}
