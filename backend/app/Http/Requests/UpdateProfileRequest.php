<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:255', 'not_regex:/\x00/'],
            'first_name' => ['sometimes', 'nullable', 'string', 'max:255', 'not_regex:/\x00/'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Le nom doit être du texte.',
            'name.max' => 'Le nom ne doit pas dépasser 255 caractères.',
            'first_name.string' => 'Le prénom doit être du texte.',
            'first_name.max' => 'Le prénom ne doit pas dépasser 255 caractères.',
        ];
    }
}
