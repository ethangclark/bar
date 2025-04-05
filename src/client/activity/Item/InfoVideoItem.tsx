import { UploadOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { Editor } from "~/client/components/editor/Editor";
import { LoadingCentered } from "~/client/components/Loading";
import { Video } from "~/client/components/Video";
import { storeObserver } from "~/client/utils/storeObserver";
import { type InfoVideo } from "~/server/db/schema";
import { isInfoVideoDraftReady } from "./itemValidator";
import { TypeTitle } from "./Layout";
import { UploadVideo } from "./UploadVideo";

export const InfoVideoItem = storeObserver<{
  infoVideoDraft: InfoVideo;
}>(function InfoVideoItem({ infoVideoDraft, draftStore }) {
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const isOk = isInfoVideoDraftReady(infoVideoDraft);
  const [newTranscript, setNewTranscript] = useState<string | null>(null);
  return (
    <div className="relative w-full">
      <div className="mb-4 flex w-full">
        <UploadVideo
          className="mr-2"
          onUploadStarted={() => setIsUploadingVideo(true)}
          onUploadComplete={({ videoId, transcript }) => {
            draftStore.updateDraft("infoVideos", {
              id: infoVideoDraft.id,
              videoId,
            });
            setNewTranscript(transcript);
            setIsUploadingVideo(false);
          }}
        >
          <Button icon={<UploadOutlined />}>Select video</Button>
        </UploadVideo>
      </div>

      <div className="relative mb-2">
        <Video
          videoId={infoVideoDraft.videoId}
          className={isUploadingVideo ? "invisible" : "visible"}
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
        {newTranscript && (
          <Button
            type="link"
            size="small"
            onClick={() => {
              draftStore.updateDraft("infoVideos", {
                id: infoVideoDraft.id,
                textAlternative: newTranscript,
              });
              setNewTranscript(null);
            }}
          >
            <span className="font-bold text-orange-500 underline">
              Update transcript
            </span>
          </Button>
        )}
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
