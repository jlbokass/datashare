<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    /**
     * Create an account.
     *
     * Public endpoint. Email addresses are trimmed and normalized before registration.
     * Name (family name) and first_name are optional; both may be null.
     * Creating an account does not sign the user in or issue a token; use the login
     * endpoint to obtain a Bearer JWT.
     */
    #[Group('Authentication', weight: 10)]
    public function __invoke(Request $request): JsonResponse
    {
        // Canonicalize email so a different letter case cannot create duplicates.
        if (is_string($request->input('email'))) {
            $request->merge(['email' => mb_strtolower(trim($request->input('email')))]);
        }

        $data = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255', 'not_regex:/\x00/'],
            'first_name' => ['sometimes', 'nullable', 'string', 'max:255', 'not_regex:/\x00/'],
        ], [
            'email.required' => 'L’adresse email est obligatoire.',
            'email.string' => 'L’adresse email doit être du texte.',
            'email.email' => 'Saisis une adresse email valide.',
            'email.max' => 'L’adresse email ne doit pas dépasser 255 caractères.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.string' => 'Le mot de passe doit être du texte.',
            'password.min' => 'Le mot de passe doit comporter au moins 8 caractères.',
            'first_name.string' => 'Le prénom doit être du texte.',
            'first_name.max' => 'Le prénom ne doit pas dépasser 255 caractères.',
            'name.string' => 'Le nom doit être du texte.',
            'name.max' => 'Le nom ne doit pas dépasser 255 caractères.',
        ]);

        // Laravel's 'hashed' model cast performs salted password hashing.
        $user = User::create($data);

        return response()->json([
            'user' => [
                'id' => $user->public_id,
                'email' => $user->email,
                'name' => $user->name,
                'first_name' => $user->first_name,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
        ], 201);
    }
}
