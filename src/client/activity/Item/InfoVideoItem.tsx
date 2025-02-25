import { UploadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import { type VideoIdParam } from "~/app/api/video/stream/route";
import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { type InfoVideo } from "~/server/db/schema";
import { UploadVideo } from "./UploadVideo";

export const InfoVideoItem = storeObserver<{
  infoVideoDraft: InfoVideo;
}>(function InfoVideoItem({ infoVideoDraft, descendentDraftStore }) {
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  return (
    <div className="relative w-full">
      <div className="mb-4 flex w-full">
        <UploadVideo
          className="mr-2"
          onUploadStarted={() => setIsUploadingVideo(true)}
          onUploadComplete={({ videoId }) => {
            descendentDraftStore.updateDraft("infoVideos", {
              id: infoVideoDraft.id,
              videoId,
            });
            setIsUploadingVideo(false);
          }}
        >
          <Button icon={<UploadOutlined />}>Select video</Button>
        </UploadVideo>
      </div>

      <video
        className={isUploadingVideo ? "invisible" : "visible"}
        width="640"
        height="360"
        controls
        src={`/api/video/stream?${"videoId" satisfies VideoIdParam}=${infoVideoDraft.videoId}`}
      />

      {isUploadingVideo && (
        <div className="absolute inset-0 bg-gray-200">
          <LoadingCentered />
        </div>
      )}

      {/* <audio controls src={videoData.audioUrl} /> */}
    </div>
  );
});
