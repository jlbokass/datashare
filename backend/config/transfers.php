<?php

return [
    // 1 GB is decimal, as explicitly documented in DESIGN-03.
    'max_file_bytes' => 1_000_000_000,
    // Local MVP operational limit, not an OC-imposed restriction.
    'max_total_bytes' => 2_000_000_000,
    'max_files' => 5,
    'allowed_extensions' => [
        'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'mp3', 'mp4', 'zip',
    ],
];
