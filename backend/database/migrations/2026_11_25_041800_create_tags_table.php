<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('transfer_file_id')->constrained('transfer_files')->cascadeOnDelete();
            $table->string('name', 30);
            $table->unique(['transfer_file_id', 'name']);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
