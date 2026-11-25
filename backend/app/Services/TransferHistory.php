<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Transfer;
use App\Models\User;

final class TransferHistory
{
    public function forUser(User $user, string $status, int $page): array
    {
        $at = now();
        $query = Transfer::query()->where('user_id', $user->getKey())->with('files.tags');

        if ($status === 'active') {
            $query->where('expires_at', '>', $at);
        } elseif ($status === 'expired') {
            $query->where('expires_at', '<=', $at);
        }

        $paginator = $query->latest()->orderByDesc('id')->paginate(10, ['*'], 'page', $page);

        return [
            'transfers' => $paginator->getCollection()
                ->map(fn (Transfer $transfer): array => TransferPresenter::toArray($transfer, $at))
                ->values()->all(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
