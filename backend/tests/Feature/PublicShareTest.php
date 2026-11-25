<?php

namespace Tests\Feature;

use App\Models\Transfer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicShareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('transfers');
    }

    private function transfer(string $name = 'report.pdf', string $contents = '%PDF-1.4', string $mime = 'application/pdf'): Transfer
    {
        $user = User::factory()->create();
        $transfer = Transfer::create([
            'user_id' => $user->getKey(),
            'share_token' => bin2hex(random_bytes(32)),
            'expires_at' => now()->addDay(),
        ]);
        $fileId = (string) Str::uuid();
        $path = $transfer->id.'/'.$fileId.'.bin';

        Storage::disk('transfers')->put($path, $contents);

        $transfer->files()->create([
            'id' => $fileId,
            'original_name' => $name,
            'size_bytes' => strlen($contents),
            'mime_type' => $mime,
            'storage_path' => $path,
        ]);

        return $transfer->load('files');
    }

    public function test_anonymous_recipient_sees_only_required_public_metadata(): void
    {
        $transfer = $this->transfer();

        $response = $this->getJson('/api/shares/'.$transfer->share_token)
            ->assertOk()
            ->assertJsonStructure(['share' => ['expires_at', 'files' => [
                ['id', 'original_name', 'mime_type', 'size_bytes', 'uploaded_at', 'password_protected'],
            ]]])
            ->assertJsonPath('share.files.0.original_name', 'report.pdf')
            ->assertJsonMissingPath('share.owner_id')
            ->assertJsonMissingPath('share.user_id')
            ->assertJsonMissingPath('share.share_token')
            ->assertJsonMissingPath('share.files.0.storage_path')
            ->assertJsonMissingPath('share.files.0.password')
            ->assertJsonMissingPath('share.files.0.password_hash')
            ->assertJsonPath('share.files.0.password_protected', false);

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_anonymous_recipient_downloads_original_bytes_as_attachment(): void
    {
        $contents = "%PDF-1.4\nHello from DataShare.";
        $transfer = $this->transfer('rapport.pdf', $contents);
        $fileId = $transfer->files[0]->id;

        $response = $this->get('/api/shares/'.$transfer->share_token.'/files/'.$fileId)
            ->assertOk()
            ->assertHeader('Content-Type', 'application/octet-stream')
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('rapport.pdf', $response->headers->get('Content-Disposition'));
        $this->assertSame($contents, $response->streamedContent());
    }

    public function test_invalid_and_unknown_tokens_return_404_without_leaking_data(): void
    {
        $this->transfer();

        foreach (['invalid', str_repeat('a', 64), str_repeat('A', 64)] as $token) {
            $this->getJson('/api/shares/'.$token)
                ->assertNotFound()
                ->assertJsonPath('code', 'not_found');

            $this->getJson('/api/shares/'.$token.'/files/'.Str::uuid())
                ->assertNotFound()
                ->assertJsonPath('code', 'not_found');
        }
    }

    public function test_expired_but_unpurged_shares_return_410_even_for_downloads(): void
    {
        $transfer = $this->transfer();
        $transfer->update(['expires_at' => now()->subMinute()]);

        $this->getJson('/api/shares/'.$transfer->share_token)
            ->assertStatus(410)
            ->assertJsonPath('code', 'share_expired');

        $this->getJson('/api/shares/'.$transfer->share_token.'/files/'.$transfer->files[0]->id)
            ->assertStatus(410)
            ->assertJsonPath('code', 'share_expired');
    }

    public function test_purged_shares_are_not_found(): void
    {
        $transfer = $this->transfer();
        $token = $transfer->share_token;
        $transfer->delete();

        $this->getJson('/api/shares/'.$token)
            ->assertNotFound()
            ->assertJsonPath('code', 'not_found');
    }

    public function test_files_must_belong_to_the_correct_share(): void
    {
        $first = $this->transfer('first.pdf');
        $second = $this->transfer('second.pdf');

        $this->getJson('/api/shares/'.$first->share_token.'/files/'.$second->files[0]->id)
            ->assertNotFound()
            ->assertJsonPath('code', 'not_found');

        $this->getJson('/api/shares/'.$first->share_token.'/files/not-a-uuid')
            ->assertNotFound()
            ->assertJsonPath('code', 'not_found');
    }

    public function test_missing_private_bytes_do_not_leak_storage_paths(): void
    {
        $transfer = $this->transfer();
        Storage::disk('transfers')->delete($transfer->files[0]->storage_path);

        $this->getJson('/api/shares/'.$transfer->share_token.'/files/'.$transfer->files[0]->id)
            ->assertNotFound()
            ->assertJsonPath('code', 'not_found');
    }

    public function test_zip_is_streamed_unchanged_and_never_extracted(): void
    {
        $contents = "PK\x03\x04inert-zip-test-fixture";
        $transfer = $this->transfer('documents.zip', $contents, 'application/zip');

        $response = $this->get('/api/shares/'.$transfer->share_token.'/files/'.$transfer->files[0]->id)
            ->assertOk()
            ->assertHeader('Content-Type', 'application/octet-stream')
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));
        $this->assertSame($contents, $response->streamedContent());
        $this->assertCount(1, Storage::disk('transfers')->allFiles());
    }
}
