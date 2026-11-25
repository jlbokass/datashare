<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('jwt.secret', 'tests-only-secret-key-64-bytes-not-for-real-world-authentication-2026');
        config()->set('jwt.issuer', 'datashare');
    }

    public function test_guest_and_invalid_jwt_cannot_update_a_profile(): void
    {
        $this->patchJson('/api/auth/me', ['name' => 'Changed'])->assertUnauthorized();
        $this->withToken('invalid.jwt.token')->patchJson('/api/auth/me', ['name' => 'Changed'])
            ->assertUnauthorized()->assertJsonPath('code', 'unauthenticated');
    }

    public function test_authenticated_owner_can_update_and_clear_only_their_own_names(): void
    {
        $owner = User::factory()->create(['name' => null, 'first_name' => null]);
        $other = User::factory()->create(['name' => 'Other', 'first_name' => 'Person']);
        $token = app(JwtService::class)->issue($owner);

        $this->withToken($token)->patchJson('/api/auth/me', [
            'name' => ' Dupont ',
            'first_name' => 'Élodie',
            'id' => $other->public_id,
            'user_id' => $other->id,
            'public_id' => $other->public_id,
            'email' => 'changed@example.com',
            'password' => 'AnotherPass123!',
        ])->assertOk()
            ->assertJsonPath('user.id', $owner->public_id)
            ->assertJsonPath('user.email', $owner->email)
            ->assertJsonPath('user.name', 'Dupont')
            ->assertJsonPath('user.first_name', 'Élodie')
            ->assertJsonMissingPath('user.password');

        $this->assertDatabaseHas('users', ['id' => $owner->id, 'name' => 'Dupont', 'first_name' => 'Élodie']);
        $this->assertDatabaseHas('users', ['id' => $other->id, 'name' => 'Other', 'first_name' => 'Person']);
        $this->assertSame($owner->email, $owner->fresh()->email);
        $this->assertSame($owner->password, $owner->fresh()->password);
        $this->assertSame($owner->public_id, $owner->fresh()->public_id);

        $this->patchJson('/api/auth/me', ['first_name' => '  '])->assertOk()
            ->assertJsonPath('user.name', 'Dupont')->assertJsonPath('user.first_name', null);
        $this->patchJson('/api/auth/me', ['name' => null])->assertOk()
            ->assertJsonPath('user.name', null);
        $this->getJson('/api/auth/me')->assertOk()
            ->assertJsonPath('user.id', $owner->public_id)
            ->assertJsonPath('user.name', null)
            ->assertJsonPath('user.first_name', null);
    }

    public function test_invalid_names_leave_the_account_unchanged(): void
    {
        $owner = User::factory()->create(['name' => 'Existing', 'first_name' => null]);
        $this->withToken(app(JwtService::class)->issue($owner))
            ->patchJson('/api/auth/me', ['name' => str_repeat('a', 256), 'first_name' => 123])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'first_name']);

        $this->assertDatabaseHas('users', ['id' => $owner->id, 'name' => 'Existing', 'first_name' => null]);
    }
}
