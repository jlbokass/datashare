<?php

namespace App\Console\Commands;

use App\Models\Transfer;
use App\Services\TransferDeletion;
use Illuminate\Console\Command;
use Throwable;

class PurgeExpiredTransfers extends Command
{
    protected $signature = 'transfers:purge-expired';

    protected $description = 'Remove expired transfers, their private files and metadata.';

    public function handle(TransferDeletion $deletion): int
    {
        $removed = 0;
        $failed = 0;

        Transfer::query()
            ->where('expires_at', '<=', now())
            ->orderBy('id')
            ->chunkById(50, function ($transfers) use ($deletion, &$removed, &$failed): void {
                foreach ($transfers as $transfer) {
                    try {
                        if ($deletion->purgeExpired($transfer->id)) {
                            $removed++;
                        }
                    } catch (Throwable $exception) {
                        report($exception);
                        $this->error("Unable to remove stored content for transfer {$transfer->id}.");
                        $failed++;
                    }
                }
            });

        $this->info("Removed {$removed} expired transfers; failed {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
