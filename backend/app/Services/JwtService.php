<?php

namespace App\Services;

use App\Models\User;
use DomainException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Str;
use RuntimeException;
use UnexpectedValueException;

class JwtService
{
    public function issue(User $user): string
    {
        $now = time();
        $ttl = (int) config('jwt.ttl_seconds', 1800);

        if ($ttl < 60 || $ttl > 86400) {
            throw new RuntimeException('JWT TTL must be between 60 seconds and 24 hours.');
        }

        return JWT::encode([
            'iss' => config('jwt.issuer', 'datashare'),
            'sub' => $user->public_id,
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttl,
            'jti' => (string) Str::uuid(),
        ], $this->secret(), 'HS256');
    }

    public function authenticate(string $token): ?User
    {
        try {
            $payload = JWT::decode($token, new Key($this->secret(), 'HS256'));
        } catch (UnexpectedValueException | DomainException $exception) {
            // Invalid, expired, tampered or unsupported tokens fail closed.
            return null;
        }

        if (! isset($payload->iss, $payload->sub)
            || ! is_string($payload->iss)
            || $payload->iss !== config('jwt.issuer')
            || ! is_string($payload->sub)
            || ! Str::isUuid($payload->sub)
        ) {
            return null;
        }

        return User::query()->where('public_id', $payload->sub)->first();
    }

    private function secret(): string
    {
        $secret = config('jwt.secret');

        if (! is_string($secret) || strlen($secret) < 32) {
            // Server configuration error, not a bad-credentials response.
            throw new RuntimeException('A dedicated JWT signing key of at least 32 bytes is required.');
        }

        return $secret;
    }
}
