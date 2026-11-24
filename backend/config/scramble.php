<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

return [
    'api_path' => 'api',

    // Scramble 0.13.55 also uses this setting for OpenAPI info.title.
    'ui' => [
        'title' => 'DataShare REST API',
    ],

    'info' => [
        'version' => '0.1.0',
        'description' => 'Create an account, manage private file transfers and share expiring download links. '
            .'Account and transfer management require a Bearer JWT, except registration and login. '
            .'Public sharing uses an independent capability token and requires no account. '
            .'System endpoints report API availability and demonstration capabilities. '
            .'Interactive documentation is available only in the local environment.',
    ],

    // Resolve the API URL against the current origin, including the Docker port.
    'servers' => [
        'DataShare' => 'api',
    ],

    // Keep Scramble's local-only access; do not define a viewApiDocs gate.
    'middleware' => [
        'web',
        RestrictedDocsAccess::class,
    ],
];
