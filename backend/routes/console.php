<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\PurgeExpiredTransfers;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Required by US01, independent of optional US10.
Schedule::command(PurgeExpiredTransfers::class)->daily()->withoutOverlapping();
