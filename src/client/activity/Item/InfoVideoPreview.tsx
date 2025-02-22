import { storeObserver } from "~/client/utils/storeObserver";
import { type InfoVideo } from "~/server/db/schema";

type Props = { infoVideo: InfoVideo };

export const InfoVideoPreview = storeObserver<Props>(function InfoVideoPreview({
  infoVideo,
}) {
  return (
    <div>
      <video
        width="640"
        height="360"
        controls
        src={`/api/video/stream?id=${infoVideo.id}`}
      />
      {/* <audio controls src={videoData.audioUrl} /> */}
    </div>
  );
});
