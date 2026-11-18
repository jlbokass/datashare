<?php

namespace App\Console\Commands;

use App\Models\Transfer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredTransfers extends Command
{
    protected $signature = 'transfers:purge-expired';

    protected $description = 'Remove expired transfers, their private files and metadata.';

    public function handle(): int
    {
        $removed = 0;
        $failed = 0;

        Transfer::query()
            ->where('expires_at', '<=', now())
            ->orderBy('id')
            ->chunkById(50, function ($transfers) use (&$removed, &$failed): void {
                foreach ($transfers as $transfer) {
                    $success = true;

                    foreach ($transfer->files as $file) {
                        $disk = Storage::disk('transfers');

                        if ($disk->exists($file->storage_path) && ! $disk->delete($file->storage_path)) {
                            $success = false;
                            $this->error("Unable to remove stored content for transfer {$transfer->id}.");
                            break;
                        }
                    }

                    if (! $success) {
                        $failed++;
                        continue;
                    }

                    // Deletes metadata via ON DELETE CASCADE. Never retain an
                    // expired transfer as a way to recover deleted file bytes.
                    $transfer->delete();
                    Storage::disk('transfers')->deleteDirectory($transfer->id);
                    $removed++;
                }
            });

        $this->info("Removed {$removed} expired transfers; failed {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
