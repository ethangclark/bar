import { type VideoIdParam } from "~/app/api/video/stream/route";

export function Video({
  videoId,
  className,
}: {
  videoId: string;
  className?: string;
}) {
  return (
    <video
      className={className}
      width="640"
      height="360"
      controls
      src={`/api/video/stream?${"videoId" satisfies VideoIdParam}=${videoId}`}
    />
  );
}
