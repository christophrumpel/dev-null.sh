import { Check, LoaderCircle, Video, X } from 'lucide-react';
import { useRef } from 'react';
import { ActionTooltip } from '@/components/action-tooltip';
import { CommitVideo } from '@/components/commit-video';
import { Button } from '@/components/ui/button';
import type { useCommitVideo } from '@/hooks/use-commit-video';

export function VideoPickerButton({
    onPick,
    disabled,
}: {
    onPick: (file: File) => Promise<void>;
    disabled: boolean;
}) {
    const input = useRef<HTMLInputElement>(null);
    return (
        <>
            <input
                ref={input}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                className="sr-only"
                tabIndex={-1}
                aria-label="Choose video"
                disabled={disabled}
                onChange={(event) => {
                    const selected = event.target.files?.[0];
                    event.target.value = '';
                    if (selected) void onPick(selected);
                }}
            />
            <ActionTooltip label="Add video · up to 60 seconds / 100 MiB">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Add video"
                    className="text-muted-foreground"
                    disabled={disabled}
                    onClick={() => input.current?.click()}
                >
                    <Video className="size-5" />
                </Button>
            </ActionTooltip>
        </>
    );
}

export function CommitVideoPicker({
    attachment,
    processing,
}: {
    attachment: ReturnType<typeof useCommitVideo>;
    processing: boolean;
}) {
    const { file, video, ready, error, progress } = attachment;
    return (
        <>
            {file && (
                <section
                    aria-label="Video attachment"
                    className="my-3 overflow-hidden rounded-lg border"
                >
                    {ready && video ? (
                        <CommitVideo
                            className="mt-0 rounded-none border-0"
                            video={{
                                ...video,
                                description: null,
                            }}
                        />
                    ) : (
                        <div
                            className="flex max-h-[70dvh] flex-col items-center justify-center gap-2 bg-muted text-muted-foreground"
                            style={{ aspectRatio: attachment.aspectRatio }}
                        >
                            {error ? (
                                <Video className="size-7" />
                            ) : (
                                <LoaderCircle className="size-7 motion-safe:animate-spin" />
                            )}
                            <p role="status" className="text-sm font-medium">
                                {error
                                    ? 'Video could not be prepared'
                                    : video?.status === 'processing'
                                      ? 'Preparing video…'
                                      : 'Uploading video…'}
                            </p>
                            <p className="text-xs">
                                {video?.status === 'processing'
                                    ? 'Preparing your video for playback'
                                    : 'Keep this tab open. You can keep writing.'}
                            </p>
                        </div>
                    )}
                    <div className="space-y-2 p-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <p
                                className="min-w-0 flex-1 truncate text-sm font-medium"
                                title={file.name}
                            >
                                {file.name}
                            </p>
                            {ready && <Check className="size-4" />}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={processing}
                                aria-label="Remove video"
                                onClick={attachment.remove}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        <progress
                            className="h-1 w-full accent-primary"
                            aria-label="Video upload"
                            max={100}
                            value={progress}
                        />
                        <p
                            role="status"
                            className="min-h-8 text-xs text-muted-foreground"
                        >
                            {error ??
                                (ready
                                    ? 'Ready to commit. Your video is not public yet.'
                                    : 'Commit becomes available when your video is ready.')}
                        </p>
                        <label className="block text-xs text-muted-foreground">
                            Video description (optional)
                            <input
                                value={attachment.description}
                                disabled={processing}
                                maxLength={1000}
                                onChange={(event) =>
                                    attachment.setDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="What happens in this video?"
                                className="mt-1 w-full rounded-md border bg-transparent px-2.5 py-2 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                            />
                        </label>
                    </div>
                </section>
            )}
            {!file && error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </>
    );
}
