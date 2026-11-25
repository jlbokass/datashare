<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\FilePasswordBytes;
use Illuminate\Foundation\Http\FormRequest;

final class AuthorizeDownloadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'password' => ['bail', 'required', 'string', 'min:6', 'max:72', 'not_regex:/\x00/', new FilePasswordBytes],
        ];
    }
}
