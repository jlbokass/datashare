<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

return [
    'api_path' => 'api',

    'info' => [
        'version' => '0.1.0',
        'description' => 'Automatically generated documentation for the DataShare API (OpenClassrooms P3, US01–US06). '
            .'The design contract remains in docs/api/openapi.yaml. '
            .'Owner operations require a Bearer JWT; public sharing uses a separate capability token. '
            .'See docs/api/README.md for inference limits and manual acceptance.',
    ],

    'ui' => [
        'title' => 'DataShare REST API',
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
