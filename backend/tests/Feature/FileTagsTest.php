<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Transfer;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class FileTagsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('jwt.secret', 'tests-only-secret-key-64-bytes-not-for-real-world-authentication-2026');
        config()->set('jwt.issuer', 'datashare');
        $this->owner = User::factory()->create();
    }

    private function transfer(User $user): Transfer
    {
        $transfer = Transfer::create([
            'user_id' => $user->getKey(),
            'share_token' => bin2hex(random_bytes(32)),
            'expires_at' => now()->addHour(),
        ]);

        foreach (['report', 'archive'] as $name) {
            $transfer->files()->create([
                'original_name' => $name.'.pdf',
                'size_bytes' => 1024,
                'mime_type' => 'application/pdf',
                'storage_path' => $transfer->id.'/'.$name.'.bin',
            ]);
        }

        return $transfer->load('files');
    }

    private function authenticate(): static
    {
        return $this->withToken(app(JwtService::class)->issue($this->owner));
    }

    private function url(Transfer $transfer): string
    {
        return '/api/transfers/'.$transfer->id.'/files/'.$transfer->files[0]->id.'/tags';
    }

    public function test_owner_can_replace_and_clear_tags_without_affecting_other_files(): void
    {
        $transfer = $this->transfer($this->owner);
        $file = $transfer->files[0];
        $otherFile = $transfer->files[1];
        $otherFile->tags()->create(['name' => 'Projet']);

        $tags = ['Projet', 'projet', str_repeat('é', 30)];
        $this->authenticate()->putJson($this->url($transfer), ['tags' => $tags])
            ->assertOk()->assertExactJson(['tags' => $tags]);
        $this->assertDatabaseCount('tags', 4);
        $this->assertSame($tags, $file->tags()->pluck('name')->all());
        $this->getJson('/api/transfers')->assertOk()
            ->assertJsonFragment(['tags' => $tags]);

        $this->putJson($this->url($transfer), ['tags' => ['Nouveau']])
            ->assertOk()->assertExactJson(['tags' => ['Nouveau']]);
        $this->putJson($this->url($transfer), ['tags' => []])
            ->assertOk()->assertExactJson(['tags' => []]);
        $this->assertDatabaseCount('tags', 1);
        $this->assertSame(['Projet'], $otherFile->tags()->pluck('name')->all());
    }

    public function test_invalid_tags_are_rejected_without_replacing_existing_tags(): void
    {
        $transfer = $this->transfer($this->owner);
        $file = $transfer->files[0];
        $file->tags()->create(['name' => 'Initial']);

        foreach ([
            [],
            ['tags' => null],
            ['tags' => 'Projet'],
            ['tags' => ['name' => 'Projet']],
            ['tags' => ['']],
            ['tags' => ['   ']],
            ['tags' => [123]],
            ['tags' => [str_repeat('é', 31)]],
            ['tags' => ['Projet', 'Projet']],
            ['tags' => ['Projet', ' Projet ']],
            ['tags' => ["invalid\0tag"]],
        ] as $payload) {
            $this->authenticate()->putJson($this->url($transfer), $payload)
                ->assertUnprocessable()->assertJsonPath('code', 'validation_error');
        }

        $this->assertSame(['Initial'], $file->tags()->pluck('name')->all());
        $this->putJson($this->url($transfer), ['tags' => [' Projet ']])
            ->assertOk()->assertExactJson(['tags' => ['Projet']]);
    }

    public function test_guests_and_non_owners_cannot_modify_tags(): void
    {
        $mine = $this->transfer($this->owner);
        $theirs = $this->transfer(User::factory()->create());

        $this->putJson($this->url($mine), ['tags' => ['Private']])->assertUnauthorized();

        foreach ([
            $this->url($theirs),
            '/api/transfers/'.$mine->id.'/files/'.$theirs->files[0]->id.'/tags',
            '/api/transfers/'.$mine->id.'/files/'.Str::uuid().'/tags',
            '/api/transfers/invalid/files/invalid/tags',
        ] as $url) {
            $this->authenticate()->putJson($url, ['tags' => ['Private']])
                ->assertNotFound()->assertJsonPath('code', 'not_found');
        }

        $this->assertDatabaseCount('tags', 0);
    }

    public function test_tags_are_private_and_deleted_with_their_file(): void
    {
        $transfer = $this->transfer($this->owner);
        $file = $transfer->files[0];
        $this->authenticate()->putJson($this->url($transfer), ['tags' => ['Private label']])->assertOk();

        $this->getJson('/api/shares/'.$transfer->share_token)
            ->assertOk()->assertJsonMissingPath('share.files.0.tags')->assertDontSee('Private label');

        $file->delete();
        $this->assertDatabaseCount('tags', 0);
    }
}
