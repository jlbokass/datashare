<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Rules\FilePasswordBytes;
use App\Services\TransferPresenter;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\File;
use Throwable;

class CreateTransferController extends Controller
{
    /**
     * Create a transfer.
     *
     * Requires a valid Bearer JWT. Uploaded files belong to the authenticated owner,
     * are stored privately and share one expiration and public link. Access ends at
     * expiration even before scheduled cleanup. Minute-based expiry is an opt-in
     * local/testing demonstration; normal transfers use day-based expiry.
     * US09: optional passwords[] must align with files[]; empty entries are unprotected.
     * Non-empty passwords must have at least 6 characters and at most 72 UTF-8 bytes.
     */
    #[Group('Transfers', weight: 20)]
    public function __invoke(Request $request): JsonResponse
    {
        $maxFiles = config('transfers.max_files', 5);
        $files = $request->file('files', []);
        $fileCount = is_array($files) ? count($files) : 0;

        $data = $request->validate([
            'files' => ['required', 'array', 'list', 'min:1', 'max:'.$maxFiles],
            'files.*' => [
                'required',
                'file',
                // Validate actual file contents rather than trusting a supplied extension.
                File::types(config('transfers.allowed_extensions'))
                    ->extensions(config('transfers.allowed_extensions')),
            ],
            'passwords' => ['sometimes', 'array', 'list', 'size:'.$fileCount],
            'passwords.*' => ['bail', 'nullable', 'string', 'min:6', 'max:72', 'not_regex:/\x00/', new FilePasswordBytes],
            'expires_in_days' => ['sometimes', 'integer', 'between:1,7', 'prohibits:expires_in_minutes'],
            'expires_in_minutes' => ['sometimes', 'integer', 'in:5', 'prohibits:expires_in_days'],
        ], [
            'files.required' => 'Ajoute au moins un fichier.',
            'files.array' => 'Les fichiers doivent être envoyés sous forme de liste.',
            'files.max' => "Tu peux envoyer jusqu'à {$maxFiles} fichiers par transfert.",
            'files.*.file' => 'Un fichier transmis est invalide.',
            'files.min' => 'Ajoute au moins un fichier.',
            'files.*.required' => 'Un fichier est manquant.',
            'files.*.mimes' => 'Le contenu de ce fichier n’est pas autorisé.',
            'files.*.extensions' => 'Cette extension n’est pas autorisée.',
            'passwords.size' => 'Associe un mot de passe facultatif à chaque fichier.',
            'passwords.*.min' => 'Le mot de passe doit comporter au moins 6 caractères.',
            'passwords.*.max' => 'Le mot de passe est limité à 72 octets UTF-8.',
            'expires_in_days.integer' => 'Choisis un nombre de jours valide.',
            'expires_in_days.between' => 'L’expiration doit être comprise entre 1 et 7 jours.',
            'expires_in_days.prohibits' => 'Choisis une seule durée d’expiration.',
            'expires_in_minutes.in' => 'Seule la durée de démonstration de 5 minutes est autorisée.',
            'expires_in_minutes.prohibits' => 'Choisis une seule durée d’expiration.',
        ]);

        $demoRequested = array_key_exists('expires_in_minutes', $data);
        $demoAllowed = app()->environment(['local', 'testing'])
            && (bool) config('transfers.demo_five_minutes', false);

        if ($demoRequested && ! $demoAllowed) {
            return response()->json([
                'message' => 'L’expiration de démonstration est désactivée.',
                'code' => 'validation_error',
                'errors' => ['expires_in_minutes' => ['Option réservée à la démonstration locale.']],
            ], 422);
        }

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
                    'expires_at' => array_key_exists('expires_in_minutes', $data)
                        ? now()->addMinutes(5)
                        : now()->addDays((int) ($data['expires_in_days'] ?? 7)),
                ]);

                foreach ($data['files'] as $index => $file) {
                    $password = $data['passwords'][$index] ?? null;
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
                        'password_hash' => $password === null ? null : Hash::make($password),
                    ]);
                }

                return $transfer->load('files.tags');
            });
        } catch (Throwable $exception) {
            // File writes are not transactional; remove any partial bytes.
            foreach ($paths as $path) {
                Storage::disk('transfers')->delete($path);
            }

            if (isset($data['passwords'])) {
                // Database exception messages may contain bound password hashes.
                Log::error('Protected transfer creation failed.', ['exception_type' => $exception::class]);
            } else {
                report($exception);
            }

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
