<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFileTagsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tags' => ['present', 'array', 'list'],
            'tags.*' => ['required', 'string', 'max:30', 'distinct:strict', 'not_regex:/\x00/'],
        ];
    }

    public function messages(): array
    {
        return [
            'tags.present' => 'Transmets une liste de tags, même vide.',
            'tags.*.required' => 'Un tag ne peut pas être vide.',
            'tags.*.max' => 'Un tag ne peut pas dépasser 30 caractères.',
            'tags.*.distinct' => 'Un tag ne peut pas être présent plusieurs fois sur un fichier.',
        ];
    }
}
