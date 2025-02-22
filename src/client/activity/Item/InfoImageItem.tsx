import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { type InfoImage } from "~/server/db/schema";
import { Editor } from "../../components/Editor";
import { Image } from "../../components/Image";
import { ImageUploadLink } from "../../components/ImageUploader";
import { storeObserver } from "../../utils/storeObserver";
import { TypeTitle } from "./Layout";

export const InfoImageItem = storeObserver<{
  infoImage: InfoImage;
}>(function InfoImage({ infoImage, activityEditorStore }) {
  return (
    <div key={infoImage.id} className="w-full">
      <Image
        alt={infoImage.url ? infoImage.textAlternative : "Missing image"}
        url={infoImage.url}
        className="max-w-full"
      />
      <div className="mb-1 flex w-full justify-center">
        <ImageUploadLink
          label="Replace image"
          onFileSelect={({ imageDataUrl }) => {
            activityEditorStore.updateDraft("infoImages", {
              id: infoImage.id,
              url: imageDataUrl,
            });
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
        setValue={(v) => {
          activityEditorStore.updateDraft("infoImages", {
            id: infoImage.id,
            textAlternative: v,
          });
        }}
      />
    </div>
  );
});
