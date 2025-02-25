import { UploadOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { type VideoIdParam } from "~/app/api/video/stream/route";
import { Editor } from "~/client/components/Editor";
import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { type InfoVideo } from "~/server/db/schema";
import { TypeTitle } from "./Layout";
import { UploadVideo } from "./UploadVideo";
import { isInfoVideoDraftReady } from "./itemValidator";

export const InfoVideoItem = storeObserver<{
  infoVideoDraft: InfoVideo;
}>(function InfoVideoItem({ infoVideoDraft, draftStore }) {
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const isOk = isInfoVideoDraftReady(infoVideoDraft);
  return (
    <div className="relative w-full">
      <div className="mb-4 flex w-full">
        <UploadVideo
          className="mr-2"
          onUploadStarted={() => setIsUploadingVideo(true)}
          onUploadComplete={({ videoId }) => {
            draftStore.updateDraft("infoVideos", {
              id: infoVideoDraft.id,
              videoId,
            });
            setIsUploadingVideo(false);
          }}
        >
          <Button icon={<UploadOutlined />}>Select video</Button>
        </UploadVideo>
      </div>

      <div className="relative mb-2">
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
      </div>

      <div className="flex items-center">
        <div className="mr-1">
          <TypeTitle>Description</TypeTitle>
        </div>
        <Tooltip
          title="Summit can't understand videos yet. This text describes the video to Summit so it knows what's being seen."
          className="text-gray-500"
        >
          <CircleHelp size={16} />
        </Tooltip>
      </div>
      <Editor
        value={infoVideoDraft.textAlternative}
        setValue={(value) => {
          draftStore.updateDraft("infoVideos", {
            id: infoVideoDraft.id,
            textAlternative: value,
          });
        }}
        className={isOk ? "" : "placeholder-red-500"}
        placeholder="Insert text description of the video here..."
      />

      {/* <audio controls src={videoData.audioUrl} /> */}
    </div>
  );
});
