<?php

namespace Tests\Feature;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private string $testSecret = 'tests-only-secret-key-64-bytes-not-for-real-world-authentication-2026';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('jwt.secret', $this->testSecret);
        config()->set('jwt.issuer', 'datashare');
        config()->set('jwt.ttl_seconds', 1800);
    }

    public function test_login_returns_a_signed_bearer_jwt_and_public_user(): void
    {
        $user = User::factory()->create([
            'email' => 'person@example.com',
            'password' => 'StrongPass123!',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'PERSON@EXAMPLE.COM',
            'password' => 'StrongPass123!',
        ])->assertOk()
            ->assertJsonStructure(['access_token', 'token_type', 'user' => ['id', 'email', 'created_at']])
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('user.id', $user->public_id)
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonMissingPath('user.password');

        $claims = JWT::decode($response->json('access_token'), new Key($this->testSecret, 'HS256'));

        $this->assertSame($user->public_id, $claims->sub);
        $this->assertSame('datashare', $claims->iss);
        $this->assertGreaterThan(time(), $claims->exp);

        $this->withToken($response->json('access_token'))
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->public_id)
            ->assertJsonMissingPath('user.password');
    }

    public function test_wrong_password_and_unknown_email_return_the_same_generic_401(): void
    {
        User::factory()->create(['email' => 'person@example.com', 'password' => 'StrongPass123!']);

        foreach (['person@example.com', 'missing@example.com'] as $email) {
            $this->postJson('/api/auth/login', [
                'email' => $email,
                'password' => 'WrongPassword123!',
            ])->assertUnauthorized()
                ->assertJsonPath('code', 'unauthenticated')
                ->assertJsonPath('message', 'Email ou mot de passe incorrect.')
                ->assertJsonMissingPath('access_token');
        }
    }

    public function test_login_rejects_malformed_credentials(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'invalid', 'password' => ''])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'validation_error')
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_me_rejects_missing_malformed_tampered_and_expired_tokens(): void
    {
        $user = User::factory()->create();
        $now = time();

        $validClaims = [
            'iss' => 'datashare',
            'sub' => $user->public_id,
            'iat' => $now - 100,
            'nbf' => $now - 100,
            'exp' => $now + 1800,
            'jti' => (string) Str::uuid(),
        ];

        $valid = JWT::encode($validClaims, $this->testSecret, 'HS256');
        $expired = JWT::encode([...$validClaims, 'exp' => $now - 5], $this->testSecret, 'HS256');
        $otherIssuer = JWT::encode([...$validClaims, 'iss' => 'another-app'], $this->testSecret, 'HS256');
        $unknownUser = JWT::encode([...$validClaims, 'sub' => (string) Str::uuid()], $this->testSecret, 'HS256');

        $this->getJson('/api/auth/me')->assertUnauthorized()->assertJsonPath('code', 'unauthenticated');

        foreach (['invalid-token', $valid.'tampered', $expired, $otherIssuer, $unknownUser] as $token) {
            $this->withToken($token)->getJson('/api/auth/me')
                ->assertUnauthorized()
                ->assertJsonPath('code', 'unauthenticated');
        }

        $this->withToken($valid)->getJson('/api/auth/me')->assertOk();
    }

    public function test_missing_jwt_signing_key_fails_closed(): void
    {
        User::factory()->create(['email' => 'person@example.com', 'password' => 'StrongPass123!']);
        config()->set('jwt.secret', '');

        // Misconfigured server must not issue unsigned or APP_KEY-derived tokens.
        $this->postJson('/api/auth/login', [
            'email' => 'person@example.com',
            'password' => 'StrongPass123!',
        ])->assertStatus(500)->assertJsonMissingPath('access_token');
    }
}
