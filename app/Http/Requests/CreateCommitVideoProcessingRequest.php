<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\CommitVideoStatus;
use App\Models\CommitVideo;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Validator;

final class CreateCommitVideoProcessingRequest extends FormRequest
{
    public function authorize(): Response
    {
        $video = $this->route('commitVideo');
        assert($video instanceof CommitVideo);

        return $video->user_id === $this->user()?->id && $video->commit_id === null ? Response::allow() : Response::denyAsNotFound();
    }

    /** @return array{} */
    public function rules(): array
    {
        return [];
    }

    /** @return list<Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $video = $this->route('commitVideo');
            assert($video instanceof CommitVideo);

            if ($video->status === CommitVideoStatus::Uploading && (! Storage::exists($video->path('source')) || Storage::size($video->path('source')) !== $video->size)) {
                $validator->errors()->add('video', 'The upload is incomplete. Please choose the video again.');
            }
        }];
    }
}
