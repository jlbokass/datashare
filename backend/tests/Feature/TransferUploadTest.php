<?php

namespace Tests\Feature;

use App\Models\Transfer;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class TransferUploadTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('transfers');
        config()->set('jwt.secret', 'tests-only-secret-key-64-bytes-not-for-real-world-authentication-2026');
        config()->set('jwt.issuer', 'datashare');
        config()->set('jwt.ttl_seconds', 1800);
        $this->owner = User::factory()->create();
    }

    private function authenticate(): static
    {
        $token = app(JwtService::class)->issue($this->owner);

        return $this->withToken($token);
    }

    public function test_guests_cannot_upload_files(): void
    {
        $this->post('/api/transfers', [
            'files' => [UploadedFile::fake()->create('report.pdf', 2, 'application/pdf')],
        ])->assertUnauthorized()->assertJsonPath('code', 'unauthenticated');

        $this->assertDatabaseCount('transfers', 0);
    }

    public function test_owner_uploads_a_private_file_and_receives_share_token(): void
    {
        $this->authenticate()->post('/api/transfers', [
            'files' => [UploadedFile::fake()->create('report.pdf', 2, 'application/pdf')],
        ])->assertCreated()
            ->assertJsonStructure(['transfer' => [
                'id', 'share_url', 'created_at', 'expires_at', 'status',
                'files' => [['id', 'original_name', 'mime_type', 'size_bytes', 'uploaded_at']],
            ]])
            ->assertJsonPath('transfer.status', 'valid')
            ->assertJsonPath('transfer.files.0.original_name', 'report.pdf');

        $transfer = Transfer::query()->with('files')->firstOrFail();

        $this->assertSame($this->owner->getKey(), $transfer->user_id);
        $this->assertTrue(Str::isUuid($transfer->id));
        $this->assertSame(64, strlen($transfer->share_token));
        $this->assertSame(1, $transfer->files->count());
        Storage::disk('transfers')->assertExists($transfer->files[0]->storage_path);
        $this->assertStringNotContainsString('report.pdf', $transfer->files[0]->storage_path);
        $this->assertDatabaseCount('transfer_files', 1);
        $this->assertSame(7, (int) now()->diffInDays($transfer->expires_at));
    }

    public function test_multiple_files_share_one_token_and_custom_expiry(): void
    {
        $this->authenticate()->post('/api/transfers', [
            'files' => [
                UploadedFile::fake()->create('first.pdf', 2, 'application/pdf'),
                UploadedFile::fake()->create('second.pdf', 3, 'application/pdf'),
            ],
            'expires_in_days' => 2,
        ])->assertCreated()
            ->assertJsonCount(2, 'transfer.files');

        $transfer = Transfer::query()->firstOrFail();
        $this->assertDatabaseCount('transfers', 1);
        $this->assertDatabaseCount('transfer_files', 2);
        $this->assertSame(2, (int) now()->diffInDays($transfer->expires_at));
    }

    public function test_missing_files_bad_expiry_and_executables_are_rejected(): void
    {
        $this->authenticate()->post('/api/transfers', [
            'expires_in_days' => 1,
        ])->assertUnprocessable()->assertJsonPath('code', 'validation_error');

        $this->authenticate()->post('/api/transfers', [
            'files' => [UploadedFile::fake()->create('report.pdf', 2, 'application/pdf')],
            'expires_in_days' => 8,
        ])->assertUnprocessable()->assertJsonPath('code', 'validation_error');

        $this->authenticate()->post('/api/transfers', [
            'files' => [UploadedFile::fake()->create('malware.exe', 2, 'application/x-msdownload')],
        ])->assertUnprocessable()->assertJsonPath('code', 'validation_error');

        $this->assertDatabaseCount('transfers', 0);
    }

    public function test_each_file_is_limited_to_one_decimal_gigabyte(): void
    {
        $this->authenticate()->post('/api/transfers', [
            // Laravel's test fake changes reported size without allocating 1GB.
            'files' => [UploadedFile::fake()->create('report.pdf', 2, 'application/pdf')->size(1_000_001)],
        ])->assertStatus(413)->assertJsonPath('code', 'payload_too_large');

        $this->assertDatabaseCount('transfers', 0);
    }

    public function test_expired_transfer_file_bytes_and_metadata_are_purged(): void
    {
        $this->authenticate()->post('/api/transfers', [
            'files' => [UploadedFile::fake()->create('report.pdf', 2, 'application/pdf')],
        ])->assertCreated();

        $transfer = Transfer::query()->with('files')->firstOrFail();
        $path = $transfer->files[0]->storage_path;
        Storage::disk('transfers')->assertExists($path);

        $transfer->update(['expires_at' => now()->subSecond()]);
        $this->artisan('transfers:purge-expired')->assertExitCode(0);

        $this->assertDatabaseCount('transfers', 0);
        $this->assertDatabaseCount('transfer_files', 0);
        Storage::disk('transfers')->assertMissing($path);
    }
}
