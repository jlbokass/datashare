<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransferFile extends Model
{
    use HasUuids;

    protected $fillable = ['transfer_id', 'original_name', 'size_bytes', 'mime_type', 'storage_path'];

    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class)->orderBy('id');
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }
}
