import { Stream } from "@cloudflare/stream-react";
import { useEffect, useState } from "react";
import { invoke } from "~/common/fnUtils";
import { trpc } from "~/trpc/proxy";
import { LoadingCentered } from "./Loading";

export function Video({
  activityId,
  videoId,
  className,
  height = 360,
  width = 640,
}: {
  activityId: string;
  videoId: string;
  className?: string;
  height?: number;
  width?: number;
}) {
  const [streamToken, setStreamToken] = useState<string | null>(null);

  useEffect(() => {
    void invoke(async () => {
      const r = await trpc.video.generateViewToken.mutate({
        activityId,
        videoId,
      });
      setStreamToken(r.streamToken);
    });
  }, [activityId, videoId]);

  if (!streamToken) {
    return <LoadingCentered />;
  }

  return (
    // <video
    //   className={className}
    //   width="640"
    //   height="360"
    //   controls
    //   src={`/api/video/stream?${"videoId" satisfies VideoIdParam}=${videoId}`}
    // />
    <div className={className} style={{ width, height }}>
      <Stream controls src={streamToken} />
    </div>
  );
}
