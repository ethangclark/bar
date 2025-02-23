import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import classnames from "classnames";
import { InfoVideoIdParam } from "~/app/api/video/upload/route";
import { storeObserver } from "~/client/utils/storeObserver";
import { invoke } from "~/common/fnUtils";
import { type InfoVideo } from "~/server/db/schema";

export const InfoVideoItem = storeObserver<{
  infoVideo: InfoVideo;
}>(function InfoVideoItem({ infoVideo, videoUploadStore }) {
  const actuallyJustDoItManually = (file: File) => {
    videoUploadStore.storePendingVideo(infoVideo.id, file);
    return false; // Prevent automatic upload
  };

  const fileStatus = videoUploadStore.fileStatus({
    infoVideoId: infoVideo.id,
  });

  return (
    <div className="w-full">
      <div className="mb-4 flex w-full">
        <Upload
          beforeUpload={actuallyJustDoItManually}
          accept="video/*"
          maxCount={1}
          className="mr-2"
        >
          <Button icon={<UploadOutlined />}>Select video</Button>
        </Upload>
        <div
          className={classnames([
            "mt-1 text-sm text-red-500",
            {
              invisible: fileStatus !== "not selected",
            },
          ])}
        >
          Please select a video to upload
        </div>
      </div>

      <div className="relative">
        {invoke(() => {
          switch (fileStatus) {
            case "not selected":
              return null;
            case "pending": {
              return (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 py-20">
                  Save to upload and view
                </div>
              );
            }
            case "saved": {
              return (
                <video
                  width="640"
                  height="360"
                  controls
                  src={`/api/video/stream?${"infoVideoId" satisfies InfoVideoIdParam}=${infoVideo.id}`}
                />
              );
            }
          }
        })}
      </div>

      {/* <audio controls src={videoData.audioUrl} /> */}
    </div>
  );
});
