import { message, Upload } from "antd";
import { useCallback } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { noop } from "~/common/fnUtils";
import { trpc } from "~/trpc/proxy";

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

        const { cloudflareUploadUrl, cloudflareStreamId } =
          await trpc.video.createUploadUrl.mutate();

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(cloudflareUploadUrl, {
          method: "POST",
          body: formData,
        });
        const asJson = await response.json();
        console.log("Upload response:", asJson);

        const { videoId, transcript } = await trpc.video.processUpload.mutate({
          cloudflareStreamId,
        });

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
