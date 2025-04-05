import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { type InfoImage } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";
import { Editor } from "../../components/editor/Editor";
import { Image } from "../../components/Image";
import { ImageUploadLink } from "../../components/ImageUploader";
import { storeObserver } from "../../utils/storeObserver";
import {
  isInfoImageDraftImageReady,
  isInfoImageDraftTextReady,
} from "./itemValidator";
import { TypeTitle } from "./Layout";

export const InfoImageItem = storeObserver<{
  infoImage: InfoImage;
}>(function InfoImage({ infoImage, draftStore, uploadStore }) {
  const imageOk = isInfoImageDraftImageReady(infoImage);
  const textOk = isInfoImageDraftTextReady(infoImage);
  return (
    <div key={infoImage.id} className="w-full">
      <Image
        alt={infoImage.url ? infoImage.textAlternative : "Missing image"}
        url={infoImage.url}
        className="max-w-full"
      />
      <div className="mb-1 flex w-full justify-center">
        <ImageUploadLink
          className={infoImage.url ? "" : "text-red-500"}
          label={imageOk ? "Replace image" : "Click here to upload image"}
          onFileSelect={async ({ imageDataUrl }) => {
            const { uploadId } = uploadStore.noteUploadStarted();
            try {
              const description = await trpc.imageDescription.describe.mutate({
                imageDataUrl,
              });
              draftStore.updateDraft("infoImages", {
                id: infoImage.id,
                url: imageDataUrl,
                textAlternative: description,
              });
            } finally {
              uploadStore.noteUploadComplete({ uploadId });
            }
          }}
        />
      </div>
      <div className="flex items-center">
        <div className="mr-1">
          <TypeTitle>Description</TypeTitle>
        </div>
        <Tooltip
          title="Summit can't understand images yet. This text describes the image to Summit so it knows what's being seen."
          className="text-gray-500"
        >
          <CircleHelp size={16} />
        </Tooltip>
      </div>
      <Editor
        value={infoImage.textAlternative}
        onChange={(v) => {
          draftStore.updateDraft("infoImages", {
            id: infoImage.id,
            textAlternative: v,
          });
        }}
        isOk={imageOk && !textOk}
        placeholder="Describe the image here..."
      />
    </div>
  );
});
