<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Transfer;
use App\Models\User;

final class TransferHistory
{
    public function forUser(User $user, bool $includeExpired = false): array
    {
        $at = now();
        $query = Transfer::query()->where('user_id', $user->getKey())->with('files');

        if (! $includeExpired) {
            $query->where('expires_at', '>', $at);
        }

        return $query->latest()->orderByDesc('id')->get()
            ->map(fn (Transfer $transfer): array => TransferPresenter::toArray($transfer, $at))
            ->values()->all();
    }
}
