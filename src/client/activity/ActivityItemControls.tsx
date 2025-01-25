import {
  type ActivityItemWithChildren,
  type InfoImage,
} from "~/server/db/schema";
import { Editor } from "../components/Editor";
import { storeObserver } from "../utils/storeObserver";
import { ImageUploader } from "../components/ImageUploader";
import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";

const InfoImageControls = storeObserver<{
  item: ActivityItemWithChildren;
  infoImage: InfoImage;
}>(function InfoImageControls({ activityEditorStore, item, infoImage }) {
  return (
    <div className="p-1">
      <div className="mb-1 flex items-center text-sm text-gray-700">
        <div className="mr-1">Image description</div>
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
          activityEditorStore.setItemInfoImageDraftTextAlternative({
            itemId: item.id,
            textAlternative: v,
          });
        }}
        flexGrow={1}
        className="mb-4"
      />
      <ImageUploader
        label="Replace image"
        onFileSelect={({ imageDataUrl }) => {
          console.log({ imageDataUrl });
          activityEditorStore.setItemInfoImageDraftUrl({
            itemId: item.id,
            url: imageDataUrl,
          });
        }}
      />
    </div>
  );
});

export const ActivityItemControls = storeObserver<{
  item: ActivityItemWithChildren;
}>(function ActivityItemControls({ item, activityEditorStore }) {
  return (
    <div>
      {item.infoImages.map((infoImage) => (
        <InfoImageControls
          key={infoImage.id}
          item={item}
          infoImage={infoImage}
        />
      ))}
      {item.infoTexts.map((infoText) => (
        <div key={infoText.id}>
          <Editor
            value={infoText.content}
            setValue={(v) => {
              activityEditorStore.setItemInfoTextDraftContent({
                itemId: item.id,
                content: v,
              });
            }}
          />
        </div>
      ))}
      {item.questions.map((question) => (
        <div key={question.id}>
          <Editor
            value={question.content}
            setValue={(v) => {
              activityEditorStore.setItemQuestionDraftContent({
                itemId: item.id,
                content: v,
              });
            }}
          />
        </div>
      ))}
    </div>
  );
});
