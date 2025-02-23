import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import classnames from "classnames";
import { type InfoVideoIdParam } from "~/app/api/video/upload/route";
import { LoadingNotCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { assertTypesExhausted } from "~/common/assertions";
import { invoke } from "~/common/fnUtils";
import { type InfoVideo } from "~/server/db/schema";

function StatusBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 py-20">
      {children}
    </div>
  );
}

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
              return <StatusBox>Save to upload and view</StatusBox>;
            }
            case "uploading": {
              return (
                <StatusBox>
                  <div className="mb-2">Uploading...</div>
                  <LoadingNotCentered />
                </StatusBox>
              );
            }
            case "errored": {
              return (
                <StatusBox>
                  <div className="flex w-[400px] flex-col items-center gap-2 text-center">
                    <div className="text-2xl text-red-500">
                      Error uploading video
                    </div>
                    <div className="text-sm">
                      Error message:{" "}
                      {videoUploadStore.errorMessage({
                        infoVideoId: infoVideo.id,
                      })}
                    </div>
                    <div className="text-sm">
                      Please email hello@summited.ai with the error message and
                      file type you're using so we can get this resolved
                    </div>
                  </div>
                </StatusBox>
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
            default:
              assertTypesExhausted(fileStatus);
          }
        })}
      </div>

      {/* <audio controls src={videoData.audioUrl} /> */}
    </div>
  );
});
