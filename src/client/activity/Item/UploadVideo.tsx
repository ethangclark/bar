import { message, Upload } from "antd";
import { useCallback } from "react";
import { z } from "zod";
import { type VideoUploadResponse } from "~/app/api/video/upload/route";
import { storeObserver } from "~/client/utils/storeObserver";
import { noop } from "~/common/fnUtils";

export const UploadVideo = storeObserver<{
  children: React.ReactNode;
  onUploadStarted?: () => void;
  onUploadComplete: (params: { videoId: string; transcript: string }) => void;
  className?: string;
}>(function UploadVideo({
  children,
  onUploadStarted = noop,
  onUploadComplete,
  className,
  uploadStore,
}) {
  const doUpload = useCallback(
    async (file: File) => {
      const { uploadId } = uploadStore.noteUploadStarted();
      const formData = new FormData();
      formData.append("video", file);
      try {
        onUploadStarted();
        const res = await fetch(`/api/video/upload`, {
          method: "POST",
          body: formData,
        });

        // Nothing to actually do with this lol.
        // Just keeping so the control flow is consistent and errors flow as expected
        const { videoId, transcript } = (
          z.object({
            videoId: z.string(),
            transcript: z.string(),
          }) satisfies z.ZodType<VideoUploadResponse>
        ).parse(await res.json());

        onUploadComplete({ videoId, transcript });
      } catch (error) {
        // Could get fancy and include the item number in the error message
        // TODO: show descriptive error state on the failed video items
        void message.error("Video upload failed.");
      } finally {
        uploadStore.noteUploadComplete({ uploadId });
      }
    },
    [uploadStore, onUploadStarted, onUploadComplete],
  );

  const actuallyJustDoItManually = useCallback(
    (file: File) => {
      void doUpload(file);
      return false; // Prevent automatic upload
    },
    [doUpload],
  );

  return (
    <Upload
      beforeUpload={actuallyJustDoItManually}
      accept="video/*"
      maxCount={1}
      className={className}
      showUploadList={false}
    >
      {children}
    </Upload>
  );
});
