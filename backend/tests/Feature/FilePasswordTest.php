<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Transfer;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class FilePasswordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('transfers');
        config()->set('jwt.secret', 'tests-only-secret-key-64-bytes-not-for-real-world-authentication-2026');
        config()->set('jwt.issuer', 'datashare');
    }

    public function test_upload_protects_only_selected_files_and_never_discloses_hashes(): void
    {
        $owner = User::factory()->create();
        $password = ' secret 123 ';
        $response = $this->withToken(app(JwtService::class)->issue($owner))->post('/api/transfers', [
            'files' => [
                UploadedFile::fake()->create('protected.pdf', 2, 'application/pdf'),
                UploadedFile::fake()->create('public.pdf', 2, 'application/pdf'),
            ],
            'passwords' => [$password, ''],
        ])->assertCreated()
            ->assertJsonPath('transfer.files.0.password_protected', true)
            ->assertJsonPath('transfer.files.1.password_protected', false)
            ->assertJsonMissingPath('transfer.files.0.password_hash')
            ->assertDontSee($password);

        $transfer = Transfer::query()->with('files')->firstOrFail();
        $file = $transfer->files->firstWhere('original_name', 'protected.pdf');
        $this->assertNotSame($password, $file->password_hash);
        $this->assertTrue(Hash::check($password, $file->password_hash));
        $this->assertNull($transfer->files->firstWhere('original_name', 'public.pdf')->password_hash);
        $response->assertDontSee($file->password_hash);

        $this->getJson('/api/transfers')->assertOk()->assertDontSee($file->password_hash);
        $this->getJson('/api/shares/'.$transfer->share_token)->assertOk()
            ->assertJsonFragment(['password_protected' => true])
            ->assertJsonMissingPath('share.files.0.password_hash')
            ->assertDontSee($file->password_hash);
    }

    public function test_upload_rejects_short_oversized_and_misaligned_passwords(): void
    {
        $owner = User::factory()->create();
        $this->withToken(app(JwtService::class)->issue($owner));

        foreach ([['short'], [str_repeat('é', 37)], ['      '], ['secret', 'extra'], [1 => 'secret'], ["secret\0"]] as $passwords) {
            $this->post('/api/transfers', [
                'files' => [UploadedFile::fake()->create('report.pdf', 2, 'application/pdf')],
                'passwords' => $passwords,
            ])->assertUnprocessable()->assertJsonPath('code', 'validation_error');
        }

        $this->assertDatabaseCount('transfers', 0);
    }

    private function share(): Transfer
    {
        $transfer = Transfer::create([
            'user_id' => User::factory()->create()->getKey(),
            'share_token' => bin2hex(random_bytes(32)),
            'expires_at' => now()->addDay(),
        ]);

        foreach (['first', 'second', 'unprotected'] as $name) {
            $path = $transfer->id.'/'.$name.'.bin';
            Storage::disk('transfers')->put($path, $name);
            $transfer->files()->create([
                'original_name' => $name.'.txt',
                'size_bytes' => strlen($name),
                'mime_type' => 'text/plain',
                'storage_path' => $path,
                'password_hash' => $name === 'unprotected' ? null : Hash::make('secret!'),
            ]);
        }

        return $transfer->load('files');
    }

    public function test_anonymous_download_requires_correct_password_and_signature_for_that_file(): void
    {
        $transfer = $this->share();
        $first = $transfer->files->firstWhere('original_name', 'first.txt');
        $second = $transfer->files->firstWhere('original_name', 'second.txt');
        $public = $transfer->files->firstWhere('original_name', 'unprotected.txt');
        $base = '/api/shares/'.$transfer->share_token.'/files/';
        $url = $base.$first->id;

        $this->getJson($url)->assertForbidden()->assertJsonPath('code', 'password_required');
        $this->postJson($url.'/authorize', [])->assertUnprocessable();
        $this->postJson($url.'/authorize', ['password' => 'incorrect'])->assertForbidden()
            ->assertJsonPath('code', 'invalid_password');

        $signed = $this->postJson($url.'/authorize', ['password' => 'secret!'])
            ->assertOk()->assertJsonStructure(['download_url'])->json('download_url');
        $this->assertStringStartsWith($url.'?', $signed);
        $this->assertStringNotContainsString('secret!', $signed);
        $this->getJson(str_replace($first->id, $second->id, $signed))->assertForbidden();
        $this->getJson($signed.'&extra=1')->assertForbidden();

        $download = $this->get($signed)->assertOk()->assertHeader('Content-Type', 'application/octet-stream');
        $this->assertStringContainsString('attachment', $download->headers->get('Content-Disposition'));
        $this->assertSame('first', $download->streamedContent());
        $this->assertSame('unprotected', $this->get($base.$public->id)->assertOk()->streamedContent());

        $this->travel(61)->seconds();
        $this->getJson($signed)->assertForbidden();
    }

    public function test_expired_or_wrong_share_cannot_be_authorized(): void
    {
        $transfer = $this->share();
        $other = $this->share();
        $url = '/api/shares/'.$transfer->share_token.'/files/'.$transfer->files[0]->id;
        $wrong = '/api/shares/'.$transfer->share_token.'/files/'.$other->files[0]->id;

        $this->postJson($wrong.'/authorize', ['password' => 'secret!'])->assertNotFound();
        $signed = $this->postJson($url.'/authorize', ['password' => 'secret!'])->assertOk()->json('download_url');
        $transfer->update(['expires_at' => now()->subSecond()]);
        $this->postJson($url.'/authorize', ['password' => 'secret!'])->assertStatus(410);
        $this->getJson($signed)->assertStatus(410);
    }

    public function test_password_attempts_are_rate_limited(): void
    {
        $transfer = $this->share();
        $url = '/api/shares/'.$transfer->share_token.'/files/'.$transfer->files[0]->id.'/authorize';
        for ($i = 0; $i < 5; $i++) {
            $this->postJson($url, ['password' => 'incorrect'])->assertForbidden();
        }

        $this->postJson($url, ['password' => 'secret!'])->assertTooManyRequests();
    }
}
