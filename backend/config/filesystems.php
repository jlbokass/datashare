<?php

// Garage is deliberately limited to its isolated local demo database.
// Never point existing local file metadata at a different storage backend.
$garageDemo = env('DATASHARE_GARAGE_DEMO', false) === true;
$garageDatabase = env('DB_DATABASE') === 'datashare_garage';

if ($garageDemo !== $garageDatabase || ($garageDemo && (
    env('APP_ENV') !== 'local'
    || env('DB_CONNECTION') !== 'pgsql'
    || env('DB_HOST') !== 'db'
    || env('DB_URL')
))) {
    throw new RuntimeException('Garage requires the isolated local datashare_garage database.');
}

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        // Uploaded transfer bytes are outside public/ and never served directly.
        'transfers' => $garageDemo ? [
            'driver' => 's3',
            'key' => env('GARAGE_DEFAULT_ACCESS_KEY'),
            'secret' => env('GARAGE_DEFAULT_SECRET_KEY'),
            'region' => 'garage',
            'bucket' => 'datashare-transfers',
            'endpoint' => 'http://garage:3900',
            'use_path_style_endpoint' => true,
            'visibility' => 'private',
            'stream_reads' => true,
            'throw' => true,
        ] : [
            'driver' => 'local',
            'root' => storage_path('app/private/transfers'),
            'visibility' => 'private',
            'serve' => false,
            'throw' => true,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
