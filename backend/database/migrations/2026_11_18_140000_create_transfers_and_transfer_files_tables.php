<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfers', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('share_token', 64)->unique();
            $table->timestampTz('expires_at')->index();
            $table->timestampsTz();
        });

        Schema::create('transfer_files', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('transfer_id')->constrained('transfers')->cascadeOnDelete();
            $table->string('original_name');
            $table->unsignedBigInteger('size_bytes');
            $table->string('mime_type', 150);
            $table->string('storage_path')->unique();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_files');
        Schema::dropIfExists('transfers');
    }
};
