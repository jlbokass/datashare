<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Transfer;
use App\Models\TransferFile;
use App\Models\User;
use App\Services\JwtService;
use App\Services\TransferDeletion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Mockery;
use RuntimeException;
use Tests\TestCase;

final class FileDeletionTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('transfers');
        config()->set('jwt.secret', 'tests-only-secret-key-64-bytes-not-for-real-world-authentication-2026');
        config()->set('jwt.issuer', 'datashare');
        $this->owner = User::factory()->create();
    }

    private function transfer(?User $owner = null, int $count = 1): Transfer
    {
        $transfer = Transfer::create([
            'user_id' => ($owner ?? $this->owner)->id,
            'share_token' => bin2hex(random_bytes(32)),
            'expires_at' => now()->addDay(),
        ]);
        for ($i = 0; $i < $count; $i++) {
            $id = (string) Str::uuid();
            $path = $transfer->id.'/'.$id.'.bin';
            Storage::disk('transfers')->put($path, 'private bytes '.$i);
            $transfer->files()->create([
                'id' => $id, 'original_name' => "file-$i.txt", 'size_bytes' => 15,
                'mime_type' => 'text/plain', 'storage_path' => $path,
            ]);
        }

        return $transfer->load('files');
    }

    private function url(Transfer $transfer, ?TransferFile $file = null): string
    {
        return '/api/transfers/'.$transfer->id.'/files/'.($file ?? $transfer->files[0])->id;
    }

    private function authenticate(): static
    {
        return $this->withToken(app(JwtService::class)->issue($this->owner));
    }

    public function test_owner_deletes_only_selected_bytes_and_metadata_and_preserves_the_share(): void
    {
        $transfer = $this->transfer(count: 2);
        [$deleted, $remaining] = $transfer->files->all();

        $this->authenticate()->deleteJson($this->url($transfer, $deleted))->assertNoContent();

        Storage::disk('transfers')->assertMissing($deleted->storage_path);
        Storage::disk('transfers')->assertExists($remaining->storage_path);
        $this->assertDatabaseMissing('transfer_files', ['id' => $deleted->id]);
        $this->assertDatabaseHas('transfer_files', ['id' => $remaining->id]);
        $this->assertDatabaseHas('transfers', ['id' => $transfer->id, 'share_token' => $transfer->share_token]);
        $this->getJson('/api/shares/'.$transfer->share_token)->assertOk()
            ->assertJsonCount(1, 'share.files')->assertJsonPath('share.files.0.id', $remaining->id);
        $this->get('/api/shares/'.$transfer->share_token.'/files/'.$remaining->id)
            ->assertOk()->assertStreamedContent('private bytes 1');
        $this->getJson('/api/shares/'.$transfer->share_token.'/files/'.$deleted->id)->assertNotFound();
        $this->getJson('/api/transfers')->assertOk()->assertJsonCount(1, 'transfers.0.files');
    }

    public function test_last_file_deletion_removes_transfer_and_invalidates_its_share_token(): void
    {
        $transfer = $this->transfer();

        $this->authenticate()->deleteJson($this->url($transfer))->assertNoContent();

        Storage::disk('transfers')->assertMissing($transfer->files[0]->storage_path);
        $this->assertDatabaseMissing('transfer_files', ['transfer_id' => $transfer->id]);
        $this->assertDatabaseMissing('transfers', ['id' => $transfer->id]);
        $this->getJson('/api/shares/'.$transfer->share_token)->assertNotFound()->assertJsonPath('code', 'not_found');
        $this->getJson('/api/shares/'.$transfer->share_token.'/files/'.$transfer->files[0]->id)->assertNotFound();
        $this->getJson('/api/transfers')->assertExactJson(['transfers' => [], 'pagination' => ['current_page' => 1, 'per_page' => 10, 'last_page' => 1, 'total' => 0]]);
        $this->deleteJson($this->url($transfer))->assertNotFound()->assertJsonPath('code', 'not_found');
    }

    public function test_missing_and_invalid_jwt_return_401_without_deleting_anything(): void
    {
        $transfer = $this->transfer();
        $this->deleteJson($this->url($transfer))->assertUnauthorized()->assertJsonPath('code', 'unauthenticated');
        $this->withToken('invalid.jwt.token')->deleteJson($this->url($transfer))
            ->assertUnauthorized()->assertJsonPath('code', 'unauthenticated');
        Storage::disk('transfers')->assertExists($transfer->files[0]->storage_path);
        $this->assertDatabaseHas('transfer_files', ['id' => $transfer->files[0]->id]);
    }

    public function test_non_owner_mismatched_unknown_and_malformed_ids_return_the_same_404(): void
    {
        $mine = $this->transfer();
        $other = $this->transfer(User::factory()->create());
        $anotherMine = $this->transfer();
        foreach ([
            $this->url($other), $this->url($mine, $other->files[0]),
            $this->url($mine, $anotherMine->files[0]),
            '/api/transfers/'.Str::uuid().'/files/'.$mine->files[0]->id,
            '/api/transfers/'.$mine->id.'/files/'.Str::uuid(),
            '/api/transfers/not-a-uuid/files/'.$mine->files[0]->id,
            '/api/transfers/'.$mine->id.'/files/not-a-uuid',
        ] as $url) {
            $this->authenticate()->deleteJson($url)->assertNotFound()->assertExactJson([
                'message' => 'Ce fichier est introuvable.', 'code' => 'not_found',
            ]);
        }
        $this->assertDatabaseCount('transfer_files', 3);
        $this->assertCount(3, Storage::disk('transfers')->allFiles());
    }

    public function test_already_missing_bytes_are_cleaned_up_without_removing_siblings(): void
    {
        $transfer = $this->transfer(count: 2);
        Storage::disk('transfers')->delete($transfer->files[0]->storage_path);

        $this->authenticate()->deleteJson($this->url($transfer))->assertNoContent();
        $this->assertDatabaseMissing('transfer_files', ['id' => $transfer->files[0]->id]);
        Storage::disk('transfers')->assertExists($transfer->files[1]->storage_path);
        $this->assertDatabaseHas('transfers', ['id' => $transfer->id]);
    }

    public function test_storage_refusal_preserves_metadata_and_returns_a_safe_500(): void
    {
        $transfer = $this->transfer();
        $disk = Storage::disk('transfers');
        $failedDisk = Mockery::mock($disk)->makePartial();
        $failedDisk->shouldReceive('delete')->with($transfer->files[0]->storage_path)->once()->andReturn(false);
        Storage::set('transfers', $failedDisk);

        $this->authenticate()->deleteJson($this->url($transfer))->assertStatus(500)->assertExactJson([
            'message' => 'Impossible de supprimer ce fichier. Réessaie plus tard.', 'code' => 'server_error',
        ]);
        $disk->assertExists($transfer->files[0]->storage_path);
        $this->assertDatabaseHas('transfer_files', ['id' => $transfer->files[0]->id]);
        $this->assertDatabaseHas('transfers', ['id' => $transfer->id]);
    }

    public function test_storage_exception_is_safe_and_a_retry_can_succeed(): void
    {
        $transfer = $this->transfer();
        $disk = Storage::disk('transfers');
        $failedDisk = Mockery::mock($disk)->makePartial();
        $failedDisk->shouldReceive('delete')->once()->andThrow(new RuntimeException('/private/sensitive-path'));
        Storage::set('transfers', $failedDisk);

        $this->authenticate()->deleteJson($this->url($transfer))->assertStatus(500)
            ->assertJsonPath('code', 'server_error')->assertDontSee('/private/sensitive-path');
        $this->assertDatabaseHas('transfer_files', ['id' => $transfer->files[0]->id]);
        Storage::set('transfers', $disk);
        $this->deleteJson($this->url($transfer))->assertNoContent();
        $disk->assertMissing($transfer->files[0]->storage_path);
    }

    public function test_metadata_is_retained_if_storage_reports_success_but_bytes_remain(): void
    {
        $transfer = $this->transfer();
        $disk = Storage::disk('transfers');
        $failedDisk = Mockery::mock($disk)->makePartial();
        $failedDisk->shouldReceive('delete')->once()->andReturn(true);
        Storage::set('transfers', $failedDisk);

        $this->authenticate()->deleteJson($this->url($transfer))->assertStatus(500);
        $disk->assertExists($transfer->files[0]->storage_path);
        $this->assertDatabaseHas('transfer_files', ['id' => $transfer->files[0]->id]);
    }

    public function test_purge_and_manual_deletion_are_safe_in_either_order(): void
    {
        $manualFirst = $this->transfer(count: 2);
        $purgeFirst = $this->transfer();
        $manualFirst->update(['expires_at' => now()->subMinute()]);
        $purgeFirst->update(['expires_at' => now()->subMinute()]);

        $this->authenticate()->deleteJson($this->url($manualFirst))->assertNoContent();
        $this->artisan('transfers:purge-expired')->assertExitCode(0);
        $this->deleteJson($this->url($purgeFirst))->assertNotFound();
        $this->artisan('transfers:purge-expired')->assertExitCode(0);
        $this->assertDatabaseCount('transfers', 0);
        $this->assertDatabaseCount('transfer_files', 0);
        $this->assertSame([], Storage::disk('transfers')->allFiles());
    }

    public function test_purge_continues_after_storage_exception_and_failed_transfer_can_be_retried(): void
    {
        $failed = $this->transfer();
        $healthy = $this->transfer();
        $failed->update(['expires_at' => now()->subMinute()]);
        $healthy->update(['expires_at' => now()->subMinute()]);
        $disk = Storage::disk('transfers');
        $failedDisk = Mockery::mock($disk)->makePartial();
        $failedDisk->shouldReceive('delete')->with($failed->files[0]->storage_path)
            ->once()->andThrow(new RuntimeException('storage unavailable'));
        Storage::set('transfers', $failedDisk);

        $this->artisan('transfers:purge-expired')->assertExitCode(1);
        $this->assertDatabaseHas('transfers', ['id' => $failed->id]);
        $this->assertDatabaseMissing('transfers', ['id' => $healthy->id]);
        Storage::set('transfers', $disk);
        $this->artisan('transfers:purge-expired')->assertExitCode(0);
        $this->assertDatabaseCount('transfers', 0);
        $this->assertSame([], $disk->allFiles());
    }

    public function test_database_failure_after_physical_deletion_returns_500_and_allows_reconciliation(): void
    {
        $transfer = $this->transfer();
        $failOnce = true;
        TransferFile::deleting(function () use (&$failOnce): void {
            if ($failOnce) {
                $failOnce = false;
                throw new RuntimeException('metadata write failed');
            }
        });

        $this->authenticate()->deleteJson($this->url($transfer))->assertStatus(500)
            ->assertJsonPath('code', 'server_error')->assertDontSee('metadata write failed');
        Storage::disk('transfers')->assertMissing($transfer->files[0]->storage_path);
        $this->assertDatabaseHas('transfer_files', ['id' => $transfer->files[0]->id]);
        $this->assertDatabaseHas('transfers', ['id' => $transfer->id]);
        $this->deleteJson($this->url($transfer))->assertNoContent();
        $this->assertDatabaseMissing('transfers', ['id' => $transfer->id]);
    }

    public function test_partial_purge_failure_retains_metadata_and_retries_already_missing_bytes(): void
    {
        $transfer = $this->transfer(count: 2);
        $transfer->update(['expires_at' => now()->subMinute()]);
        $disk = Storage::disk('transfers');
        $failedDisk = Mockery::mock($disk)->makePartial();
        $attempts = 0;
        $failedDisk->shouldReceive('delete')->twice()->andReturnUsing(function (string $path) use ($disk, &$attempts): bool {
            if (++$attempts === 2) {
                throw new RuntimeException('second deletion failed');
            }

            return $disk->delete($path);
        });
        Storage::set('transfers', $failedDisk);

        $this->artisan('transfers:purge-expired')->assertExitCode(1);
        $this->assertDatabaseCount('transfer_files', 2);
        $this->assertDatabaseHas('transfers', ['id' => $transfer->id]);
        $this->assertCount(1, $disk->allFiles());
        Storage::set('transfers', $disk);
        $this->artisan('transfers:purge-expired')->assertExitCode(0);
        $this->assertDatabaseCount('transfer_files', 0);
        $this->assertDatabaseCount('transfers', 0);
        $this->assertSame([], $disk->allFiles());
    }

    public function test_purge_rechecks_a_missing_or_no_longer_expired_candidate(): void
    {
        $transfer = $this->transfer();
        $deletion = app(TransferDeletion::class);
        $this->assertFalse($deletion->purgeExpired($transfer->id));
        Storage::disk('transfers')->assertExists($transfer->files[0]->storage_path);

        $this->authenticate()->deleteJson($this->url($transfer))->assertNoContent();
        $this->assertFalse($deletion->purgeExpired($transfer->id));
    }
}
