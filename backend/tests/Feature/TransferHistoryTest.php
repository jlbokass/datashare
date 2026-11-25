<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Transfer;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TransferHistoryTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->startOfSecond());
        config()->set('jwt.secret', 'tests-only-secret-key-64-bytes-not-for-real-world-authentication-2026');
        config()->set('jwt.issuer', 'datashare');
        $this->owner = User::factory()->create();
    }

    private function transfer(User $owner, int $expiresInSeconds = 3600): Transfer
    {
        $transfer = Transfer::create([
            'user_id' => $owner->getKey(),
            'share_token' => bin2hex(random_bytes(32)),
            'expires_at' => now()->addSeconds($expiresInSeconds),
        ]);
        $transfer->files()->create([
            'original_name' => 'report.pdf',
            'size_bytes' => 1024,
            'mime_type' => 'application/pdf',
            'storage_path' => $transfer->id.'/private.bin',
        ]);

        return $transfer->load('files');
    }

    private function authenticate(User $user): static
    {
        return $this->withToken(app(JwtService::class)->issue($user));
    }

    public function test_anonymous_and_invalid_tokens_are_rejected(): void
    {
        $this->getJson('/api/transfers')->assertUnauthorized()->assertJsonPath('code', 'unauthenticated');
        $this->withToken('invalid.jwt.token')->getJson('/api/transfers?include_expired=true')
            ->assertUnauthorized()->assertJsonPath('code', 'unauthenticated');
    }

    public function test_empty_history_is_an_empty_array_even_if_other_users_have_files(): void
    {
        $this->transfer(User::factory()->create());

        $this->authenticate($this->owner)->getJson('/api/transfers')
            ->assertOk()->assertExactJson(['transfers' => [], 'pagination' => ['current_page' => 1, 'per_page' => 10, 'last_page' => 1, 'total' => 0]]);
    }

    public function test_history_is_scoped_to_the_verified_user_in_both_expiry_modes(): void
    {
        $other = User::factory()->create();
        $mine = $this->transfer($this->owner);
        $theirs = $this->transfer($other);
        $theirExpired = $this->transfer($other, -1);

        foreach (['false', 'true'] as $includeExpired) {
            $this->authenticate($this->owner)
                ->getJson('/api/transfers?include_expired='.$includeExpired.'&user_id='.$other->id)
                ->assertOk()->assertJsonCount(1, 'transfers')
                ->assertJsonPath('transfers.0.id', $mine->id)
                ->assertDontSee($theirs->share_token)->assertDontSee($theirExpired->share_token);
        }

        $this->authenticate($other)->getJson('/api/transfers')
            ->assertOk()->assertJsonCount(1, 'transfers')->assertJsonPath('transfers.0.id', $theirs->id);
    }

    public function test_multiple_files_expose_only_the_openapi_fields_and_response_is_not_cached(): void
    {
        $transfer = $this->transfer($this->owner);
        $transfer->files()->create([
            'original_name' => 'archive.zip', 'size_bytes' => 2048,
            'mime_type' => 'application/zip', 'storage_path' => $transfer->id.'/archive.bin',
        ]);
        $transfer->load('files');

        $response = $this->authenticate($this->owner)->getJson('/api/transfers')
            ->assertOk()->assertExactJson(['transfers' => [[
                'id' => $transfer->id,
                'share_url' => '/share/'.$transfer->share_token,
                'created_at' => $transfer->created_at->toIso8601String(),
                'expires_at' => $transfer->expires_at->toIso8601String(),
                'status' => 'valid',
                'files' => $transfer->files->map(fn ($file): array => [
                    'id' => $file->id, 'original_name' => $file->original_name,
                    'size_bytes' => $file->size_bytes, 'mime_type' => $file->mime_type,
                    'uploaded_at' => $file->created_at->toIso8601String(),
                    'tags' => [],
                    'password_protected' => false,
                ])->all(),
            ]], 'pagination' => ['current_page' => 1, 'per_page' => 10, 'last_page' => 1, 'total' => 1]]);

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_expired_records_are_excluded_by_default_and_with_false(): void
    {
        $valid = $this->transfer($this->owner, 1);
        $this->transfer($this->owner, -1);
        $this->transfer($this->owner, 0);

        foreach (['', '?include_expired=false'] as $query) {
            $this->authenticate($this->owner)->getJson('/api/transfers'.$query)
                ->assertOk()->assertJsonCount(1, 'transfers')
                ->assertJsonPath('transfers.0.id', $valid->id)
                ->assertJsonPath('transfers.0.status', 'valid');
        }
    }

    public function test_include_expired_returns_unpurged_records_with_derived_status(): void
    {
        $valid = $this->transfer($this->owner, 1);
        $expired = $this->transfer($this->owner, -1);
        $boundary = $this->transfer($this->owner, 0);
        $purged = $this->transfer($this->owner, -100);
        $purged->delete();

        $response = $this->authenticate($this->owner)->getJson('/api/transfers?include_expired=true')
            ->assertOk()->assertJsonCount(3, 'transfers')->assertDontSee($purged->share_token);
        $statuses = collect($response->json('transfers'))->pluck('status', 'id')->all();

        $this->assertSame('valid', $statuses[$valid->id]);
        $this->assertSame('expired', $statuses[$expired->id]);
        $this->assertSame('expired', $statuses[$boundary->id]);

        $this->travel(2)->seconds();
        $this->getJson('/api/transfers')->assertOk()->assertExactJson(['transfers' => [], 'pagination' => ['current_page' => 1, 'per_page' => 10, 'last_page' => 1, 'total' => 0]]);
    }

    public function test_pagination_filters_owner_and_status_before_slicing(): void
    {
        $active = [];
        for ($i = 0; $i < 11; $i++) {
            $transfer = $this->transfer($this->owner);
            $transfer->forceFill(['created_at' => now()->subMinutes(11 - $i)])->save();
            $active[] = $transfer;
        }

        $expired = $this->transfer($this->owner, -1);
        $other = $this->transfer(User::factory()->create());

        $this->authenticate($this->owner)->getJson('/api/transfers')
            ->assertOk()->assertJsonCount(10, 'transfers')
            ->assertJsonPath('transfers.0.id', $active[10]->id)
            ->assertJsonPath('pagination', ['current_page' => 1, 'per_page' => 10, 'last_page' => 2, 'total' => 11])
            ->assertDontSee($other->share_token);

        $this->getJson('/api/transfers?page=2')
            ->assertOk()->assertJsonCount(1, 'transfers')
            ->assertJsonPath('transfers.0.id', $active[0]->id)
            ->assertJsonPath('pagination.current_page', 2);

        $this->getJson('/api/transfers?status=all')
            ->assertOk()->assertJsonPath('pagination.total', 12);

        $this->getJson('/api/transfers?status=expired&include_expired=false')
            ->assertOk()->assertJsonCount(1, 'transfers')
            ->assertJsonPath('transfers.0.id', $expired->id)
            ->assertJsonPath('pagination.total', 1);

        $this->getJson('/api/transfers?page=3')
            ->assertOk()->assertJsonCount(0, 'transfers')
            ->assertJsonPath('pagination.current_page', 3)
            ->assertJsonPath('pagination.last_page', 2);
    }

    public function test_invalid_page_and_status_are_rejected(): void
    {
        $this->authenticate($this->owner)->getJson('/api/transfers?page=0&status=unknown')
            ->assertUnprocessable()->assertJsonPath('code', 'validation_error')
            ->assertJsonValidationErrors(['page', 'status']);
    }
}
