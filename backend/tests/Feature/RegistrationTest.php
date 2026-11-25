<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_register_without_a_name_or_confirmation_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'New.User@Example.COM',
            'password' => 'SecurePass123!',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'email', 'name', 'first_name', 'created_at']])
            ->assertJsonPath('user.name', null)
            ->assertJsonPath('user.first_name', null)
            ->assertJsonPath('user.email', 'new.user@example.com')
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('access_token');

        $user = User::where('email', 'new.user@example.com')->firstOrFail();

        $this->assertTrue(Str::isUuid($response->json('user.id')));
        $this->assertSame($user->public_id, $response->json('user.id'));
        $this->assertNotSame('SecurePass123!', $user->password);
        $this->assertTrue(Hash::check('SecurePass123!', $user->password));
    }

    public function test_optional_names_are_trimmed_and_persisted(): void
    {
        $this->postJson('/api/auth/register', [
            'email' => 'named@example.com',
            'password' => 'SecurePass123!',
            'name' => ' Dupont ',
            'first_name' => ' Élodie ',
        ])->assertCreated()
            ->assertJsonPath('user.name', 'Dupont')
            ->assertJsonPath('user.first_name', 'Élodie');

        $this->assertDatabaseHas('users', [
            'email' => 'named@example.com',
            'name' => 'Dupont',
            'first_name' => 'Élodie',
        ]);
    }

    public function test_invalid_optional_names_are_rejected(): void
    {
        $this->postJson('/api/auth/register', [
            'email' => 'named@example.com',
            'password' => 'SecurePass123!',
            'name' => str_repeat('a', 256),
            'first_name' => ['invalid'],
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'first_name']);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_invalid_email_is_rejected(): void
    {
        $this->postJson('/api/auth/register', [
            'email' => 'not-an-email',
            'password' => 'SecurePass123!',
        ])->assertUnprocessable()
            ->assertJsonPath('code', 'validation_error')
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_short_password_is_rejected(): void
    {
        $this->postJson('/api/auth/register', [
            'email' => 'user@example.com',
            'password' => 'short',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_duplicate_email_is_rejected_even_with_different_case(): void
    {
        $this->postJson('/api/auth/register', [
            'email' => 'user@example.com',
            'password' => 'SecurePass123!',
        ])->assertCreated();

        $this->postJson('/api/auth/register', [
            'email' => 'USER@EXAMPLE.COM',
            'password' => 'AnotherPass123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', 'Cette adresse email est déjà utilisée.');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_required_fields_are_validated(): void
    {
        $this->postJson('/api/auth/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }
}
