<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Transfer;
use App\Models\TransferFile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

final class TransferDeletion
{
    public function deleteFile(User $owner, string $transferId, string $fileId): bool
    {
        // Reject malformed UUIDs before querying PostgreSQL's uuid columns.
        if (! Str::isUuid($transferId) || ! Str::isUuid($fileId)) {
            return false;
        }

        return DB::transaction(function () use ($owner, $transferId, $fileId): bool {
            // Both manual deletion and expiry purge acquire this parent lock
            // before reading files, so the last-file decision is serialized.
            $transfer = Transfer::query()->where('user_id', $owner->getKey())
                ->whereKey($transferId)->lockForUpdate()->first();

            if ($transfer === null) {
                return false;
            }

            $file = $transfer->files()->whereKey($fileId)->first();
            if ($file === null) {
                return false;
            }

            $this->removeBytes($file);
            $file->delete();

            if (! $transfer->files()->exists()) {
                $transfer->delete();
            }

            return true;
        });
    }

    public function purgeExpired(string $transferId): bool
    {
        return DB::transaction(function () use ($transferId): bool {
            // Re-fetch after acquiring the lock: the candidate may have been
            // removed by a manual request or another scheduler in the meantime.
            $transfer = Transfer::query()->whereKey($transferId)->lockForUpdate()->first();
            if ($transfer === null || $transfer->expires_at->isFuture()) {
                return false;
            }

            foreach ($transfer->files()->get() as $file) {
                $this->removeBytes($file);
            }

            // Cascade removes file metadata only after all bytes are gone.
            $transfer->delete();

            return true;
        });
    }

    private function removeBytes(TransferFile $file): void
    {
        $disk = Storage::disk('transfers');
        $path = $file->storage_path;

        // Already-missing content is safe to reconcile. Failures/exceptions
        // retain DB metadata for retry; filesystem changes cannot roll back.
        if ($disk->exists($path) && (! $disk->delete($path) || $disk->exists($path))) {
            throw new RuntimeException('Unable to remove private file content.');
        }
    }
}
