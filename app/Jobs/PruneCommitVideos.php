<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\DeleteCommitVideo;
use App\Enums\CommitVideoStatus;
use App\Models\CommitVideo;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\StorageAttributes;

final class PruneCommitVideos implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public function handle(DeleteCommitVideo $delete): void
    {
        $cutoff = now()->subDay();
        // Signed upload URLs expire after 15 minutes, so unfinished uploads never need an hour.
        $uploadCutoff = now()->subHour();

        CommitVideo::query()->whereNull('commit_id')
            ->where(fn (Builder $query): Builder => $query->where('created_at', '<', $cutoff)
                ->orWhere(fn (Builder $query): Builder => $query->whereIn('status', [CommitVideoStatus::Uploading, CommitVideoStatus::Failed])->where('created_at', '<', $uploadCutoff)))
            ->eachById($delete->handle(...));

        // Signed PUTs may arrive after cancellation deleted the row.
        foreach (Storage::disk()->listContents('video-uploads')->filter(fn (StorageAttributes $entry): bool => $entry->isFile()) as $entry) {
            if (Storage::lastModified($entry->path()) < $uploadCutoff->getTimestamp()) {
                Storage::delete($entry->path());
            }
        }

        $scratch = storage_path('app/video-processing');

        if (File::isDirectory($scratch)) {
            foreach (glob($scratch.'/*', GLOB_ONLYDIR) ?: [] as $directory) {
                if (File::lastModified($directory) < $cutoff->getTimestamp()) {
                    File::deleteDirectory($directory);
                }
            }
        }
    }
}
