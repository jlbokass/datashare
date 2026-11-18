<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Keep Laravel's numeric internal key for existing relations, but expose
        // a separate unpredictable UUID in the public API contract.
        Schema::table('users', function (Blueprint $table): void {
            $table->uuid('public_id')->nullable()->unique();
            $table->string('name')->nullable()->change();
        });

        // Preserve existing local accounts when this migration runs.
        DB::table('users')->orderBy('id')->chunkById(100, function ($users): void {
            foreach ($users as $user) {
                DB::table('users')->where('id', $user->id)->update([
                    'public_id' => (string) Str::uuid(),
                ]);
            }
        });
    }

    public function down(): void
    {
        // Restore the original Laravel starter schema without losing accounts.
        DB::table('users')->whereNull('name')->update(['name' => '']);

        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['public_id']);
            $table->dropColumn('public_id');
            $table->string('name')->nullable(false)->change();
        });
    }
};
