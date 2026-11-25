<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Transfer;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class FileTags
{
    /**
     * @param  list<string>  $tags
     * @return list<string>|null
     */
    public function replace(User $owner, string $transferId, string $fileId, array $tags): ?array
    {
        if (! Str::isUuid($transferId) || ! Str::isUuid($fileId)) {
            return null;
        }

        return DB::transaction(function () use ($owner, $transferId, $fileId, $tags): ?array {
            // Use the same parent lock as manual deletion and expiration purge.
            $transfer = Transfer::query()->where('user_id', $owner->getKey())
                ->whereKey($transferId)->lockForUpdate()->first();

            if ($transfer === null) {
                return null;
            }

            $file = $transfer->files()->whereKey($fileId)->first();
            if ($file === null) {
                return null;
            }

            $file->tags()->delete();
            $file->tags()->createMany(array_map(fn (string $name): array => ['name' => $name], $tags));

            return $tags;
        });
    }
}
