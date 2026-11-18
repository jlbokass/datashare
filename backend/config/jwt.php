<?php

return [
    // Use a dedicated random key, NEVER Laravel's APP_KEY.
    'secret' => env('JWT_SECRET', ''),
    'issuer' => env('JWT_ISSUER', 'datashare'),
    'ttl_seconds' => (int) env('JWT_TTL_SECONDS', 1800),
];
