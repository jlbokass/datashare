<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\PurgeExpiredTransfers;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Required by US01, independent of optional US10.
$purge = Schedule::command(PurgeExpiredTransfers::class);

// The five-minute demo needs minute-level cleanup; standard MVP uses daily purge.
if (app()->environment('local') && config('transfers.demo_five_minutes', false)) {
    $purge->everyMinute()->withoutOverlapping();
} else {
    $purge->daily()->withoutOverlapping();
}
