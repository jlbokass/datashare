<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class FilePasswordBytes implements ValidationRule
{
    // Run even for a supplied whitespace-only value; null remains optional.
    public bool $implicit = true;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        // Bcrypt supports at most 72 bytes; reject rather than truncate.
        if (! is_string($value) || strlen($value) > 72 || trim($value) === '') {
            $fail('Le mot de passe doit être non vide et limité à 72 octets UTF-8.');
        }
    }
}
