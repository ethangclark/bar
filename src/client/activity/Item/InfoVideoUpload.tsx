import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import classnames from "classnames";
import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { type InfoVideo } from "~/server/db/schema";

type Props = { infoVideo: InfoVideo };

export const InfoVideoUpload = storeObserver<Props>(function InfoVideoUpload({
  infoVideo,
  videoUploadStore,
}) {
  const [videoSelected, setVideoSelected] = useState(false);

  const actuallyJustDoItManually = (file: File) => {
    setVideoSelected(true);
    videoUploadStore.addNonUploadedVideoFile(infoVideo.id, file);
    return false; // Prevent automatic upload
  };

  return (
    <div className="flex w-full">
      <Upload
        beforeUpload={actuallyJustDoItManually}
        accept="video/*"
        maxCount={1}
        className="mr-2"
      >
        <Button icon={<UploadOutlined />}>Select Video</Button>
      </Upload>
      <div
        className={classnames([
          "mt-1 text-sm text-gray-500",
          videoSelected ? "visible" : "invisible",
        ])}
      >
        Save to preview
      </div>
    </div>
  );
});
