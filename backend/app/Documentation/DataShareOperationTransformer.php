<?php

declare(strict_types=1);

namespace App\Documentation;

use App\Http\Controllers\Api\CreateTransferController;
use App\Http\Controllers\Api\DownloadPublicShareFileController;
use App\Http\Controllers\Api\ShowPublicShareController;
use App\Http\Middleware\AuthenticateJwt;
use Dedoc\Scramble\Contracts\OperationTransformer;
use Dedoc\Scramble\Support\Generator\Header;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Types\ArrayType;
use Dedoc\Scramble\Support\Generator\Types\ObjectType;
use Dedoc\Scramble\Support\Generator\Types\StringType;
use Dedoc\Scramble\Support\Generator\Types\Type;
use Dedoc\Scramble\Support\RouteInfo;

/** Documentation-only corrections for behavior outside Scramble's inference. */
final class DataShareOperationTransformer implements OperationTransformer
{
    public function handle(Operation $operation, RouteInfo $routeInfo): void
    {
        $controller = $routeInfo->className();

        if (in_array(AuthenticateJwt::class, $routeInfo->route->gatherMiddleware(), true)) {
            $operation->addResponse($this->error(401, 'unauthenticated', 'Missing, invalid or expired JWT.'));
        }

        // bootstrap/app.php renders validation errors with our machine-readable code.
        foreach ($operation->responses as $index => $response) {
            $resolved = $response instanceof Response ? $response : $response->resolve();
            if ($resolved->code === 422) {
                $operation->responses[$index] = $this->error(422, 'validation_error', 'Invalid input, file type or expiration.')
                    ->setContent('application/json', Schema::fromType(
                        $this->errorType('validation_error')
                            ->addProperty('errors', (new ObjectType)->additionalProperties(
                                (new ArrayType)->setItems(new StringType)
                            ))->addRequired(['errors'])
                    ));
            }
        }

        if (in_array($controller, [ShowPublicShareController::class, DownloadPublicShareFileController::class], true)) {
            $operation->addResponse($this->error(404, 'not_found', 'Unknown token, missing file or file outside this share.'));
            $operation->addResponse($this->error(410, 'share_expired', 'Expired share awaiting purge; purged shares return 404.'));
        }

        if ($controller === DownloadPublicShareFileController::class) {
            // Storage::download() is inferred as a generic JSON response through the union return type.
            $operation->responses = array_values(array_filter(
                $operation->responses,
                fn ($response) => ($response instanceof Response ? $response : $response->resolve())->code !== 200,
            ));
            $operation->addResponse(Response::make(200)
                ->setDescription('File bytes streamed as an attachment; no JWT required.')
                ->setContent('application/octet-stream', Schema::fromType((new StringType)->format('binary')))
                ->addHeader('Content-Disposition', new Header(
                    description: 'Attachment with a sanitized original filename.',
                    schema: Schema::fromType(new StringType),
                ))
                ->addHeader('X-Content-Type-Options', new Header(schema: Schema::fromType((new StringType)->const('nosniff'))))
                ->addHeader('Cache-Control', new Header(schema: Schema::fromType((new StringType)->const('private, no-store, max-age=0')))));
            $operation->addResponse(Response::make(500)
                ->setDescription('Unhandled storage failure before streaming starts. Framework error, not the custom server_error envelope; a failure after headers may truncate the download.')
                ->setContent('application/json', Schema::fromType(
                    (new ObjectType)->addProperty('message', new StringType)->setRequired(['message'])
                )));
        }

        foreach ($operation->parameters as $parameter) {
            if ($parameter->in === 'path' && in_array($parameter->name, ['transferId', 'fileId'], true)) {
                $parameter->schema->type->format('uuid');
            }
            if ($parameter->in === 'path' && $parameter->name === 'token') {
                $parameter->description = 'Independent public share capability, not a login JWT.';
                $parameter->schema->type->pattern('^[a-f0-9]{64}$');
            }
            if ($parameter->name === 'include_expired') {
                $parameter->description = 'Default false: only non-expired transfers. True includes expired records awaiting purge. '
                    .'Owner only, newest first (created_at then id), without pagination.';
            }
        }

        if ($controller === CreateTransferController::class) {
            $this->describeUpload($operation);
        }

        foreach ($operation->responses as $response) {
            $response = $response instanceof Response ? $response : $response->resolve();
            if (isset($response->content['application/json'])) {
                $schema = $response->getContent('application/json');
                if ($schema instanceof Schema) {
                    $this->describeFormats($schema->type);
                }
            }
        }
    }

    private function describeUpload(Operation $operation): void
    {
        $schema = $operation->requestBodyObject->getContent('multipart/form-data')->schema->type;
        $files = $schema->properties['files'];
        $files->setDescription('Send repeated files[] multipart parts. Maximum '.config('transfers.max_file_bytes')
            .' bytes per file and '.config('transfers.max_total_bytes').' bytes total. Allowed extensions: '
            .implode(', ', config('transfers.allowed_extensions')).'. File content and extension are both checked.');
        // PHP requires bracketed field names to receive multiple uploaded files as an array.
        unset($schema->properties['files']);
        $schema->properties['files[]'] = $files;
        $schema->required = array_map(fn (string $name) => $name === 'files' ? 'files[]' : $name, $schema->required);
        $schema->properties['expires_in_days']->default(7)
            ->setDescription('1–7 days; defaults to 7 when neither expiry field is supplied. Mutually exclusive with expires_in_minutes.');
        $schema->properties['expires_in_minutes']->enum([5])
            ->setDescription('Local/testing demo only, with TRANSFER_DEMO_5_MIN_ENABLED=true. Otherwise 422. Mutually exclusive with expires_in_days.');
    }

    private function describeFormats(Type $type): void
    {
        if ($type instanceof ArrayType) {
            $this->describeFormats($type->items);
        }
        if (! $type instanceof ObjectType) {
            return;
        }
        foreach ($type->properties as $name => $property) {
            if ($property instanceof StringType) {
                $format = match ($name) {
                    'id' => 'uuid',
                    'email' => 'email',
                    'created_at', 'expires_at', 'uploaded_at' => 'date-time',
                    default => null,
                };
                if ($format !== null) {
                    $property->format($format);
                }
            }
            if ($property instanceof Type) {
                $this->describeFormats($property);
            }
        }
    }

    private function error(int $status, string $code, string $description): Response
    {
        return Response::make($status)->setDescription($description)
            ->setContent('application/json', Schema::fromType($this->errorType($code)));
    }

    private function errorType(string $code): ObjectType
    {
        return (new ObjectType)
            ->addProperty('message', new StringType)
            ->addProperty('code', (new StringType)->const($code))
            ->setRequired(['message', 'code']);
    }
}
