<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Services\TransferPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\File;
use Throwable;

class CreateTransferController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $maxFiles = config('transfers.max_files', 5);

        $data = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:'.$maxFiles],
            'files.*' => [
                'required',
                'file',
                // Validate actual file contents rather than trusting a supplied extension.
                File::types(config('transfers.allowed_extensions'))
                    ->extensions(config('transfers.allowed_extensions')),
            ],
            'expires_in_days' => ['sometimes', 'integer', 'between:1,7'],
        ], [
            'files.required' => 'Ajoute au moins un fichier.',
            'files.array' => 'Les fichiers doivent être envoyés sous forme de liste.',
            'files.max' => "Tu peux envoyer jusqu'à {$maxFiles} fichiers par transfert.",
            'files.*.file' => 'Un fichier transmis est invalide.',
            'files.min' => 'Ajoute au moins un fichier.',
            'files.*.required' => 'Un fichier est manquant.',
            'files.*.mimes' => 'Le contenu de ce fichier n’est pas autorisé.',
            'files.*.extensions' => 'Cette extension n’est pas autorisée.',
            'expires_in_days.integer' => 'Choisis un nombre de jours valide.',
            'expires_in_days.between' => 'L’expiration doit être comprise entre 1 et 7 jours.',
        ]);

        $maxFileBytes = (int) config('transfers.max_file_bytes');
        $maxTotalBytes = (int) config('transfers.max_total_bytes');
        $totalBytes = 0;

        foreach ($data['files'] as $file) {
            $size = $file->getSize();
            if (! is_int($size) || $size > $maxFileBytes) {
                return response()->json([
                    'message' => 'La taille de chaque fichier est limitée à 1 Go.',
                    'code' => 'payload_too_large',
                ], 413);
            }

            $totalBytes += $size;
            if ($totalBytes > $maxTotalBytes) {
                return response()->json([
                    'message' => 'La taille totale du transfert est limitée à 2 Go.',
                    'code' => 'payload_too_large',
                ], 413);
            }
        }

        $paths = [];

        try {
            $transfer = DB::transaction(function () use ($data, $request, &$paths): Transfer {
                $transfer = Transfer::create([
                    'user_id' => $request->user()->getKey(),
                    'share_token' => bin2hex(random_bytes(32)),
                    'expires_at' => now()->addDays((int) ($data['expires_in_days'] ?? 7)),
                ]);

                foreach ($data['files'] as $file) {
                    $fileId = (string) Str::uuid();
                    // Never use the original filename in a private storage path.
                    $path = "{$transfer->id}/{$fileId}.bin";

                    if (! Storage::disk('transfers')->putFileAs(
                        $transfer->id, $file, "{$fileId}.bin"
                    )) {
                        throw new \RuntimeException('Private file storage failed.');
                    }

                    $paths[] = $path;
                    $name = basename(str_replace('\\', '/', $file->getClientOriginalName()));
                    $name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?: 'file';
                    $name = mb_substr($name, 0, 255);

                    $transfer->files()->create([
                        'id' => $fileId,
                        'original_name' => $name,
                        'size_bytes' => $file->getSize(),
                        'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                        'storage_path' => $path,
                    ]);
                }

                return $transfer->load('files');
            });
        } catch (Throwable $exception) {
            // File writes are not transactional; remove any partial bytes.
            foreach ($paths as $path) {
                Storage::disk('transfers')->delete($path);
            }

            report($exception);

            return response()->json([
                'message' => 'Impossible de stocker ce transfert.',
                'code' => 'server_error',
            ], 500);
        }

        return response()->json([
            'transfer' => TransferPresenter::toArray($transfer),
        ], 201);
    }
}
