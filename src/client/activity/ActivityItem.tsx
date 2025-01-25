import { type ActivityItemWithChildren } from "~/server/db/schema";
import { Editor, WysiwygEditor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { storeObserver } from "../utils/storeObserver";
import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { ImageUploadLink } from "../components/ImageUploader";

export const ActivityItem = storeObserver<{
  item: ActivityItemWithChildren;
  showControls: boolean;
}>(function ActivityItem({ item, showControls, activityEditorStore }) {
  return (
    <div className="flex flex-col items-center p-4" style={{ width: 500 }}>
      {item.infoImages.map((infoImage) => (
        <div key={infoImage.id}>
          <ImageFromDataUrl
            alt={"Upload an image to include in activity"}
            src={infoImage.url}
            style={{
              maxWidth: "100%",
              marginBottom: 4,
            }}
          />
          <div className="flex items-center">
            <div className="flex items-center text-sm text-gray-700">
              <div className="mr-1">Description</div>
              <Tooltip
                title="Summit can't understand images yet. This text describes the image to Summit so it knows what's being seen."
                className="text-gray-500"
              >
                <CircleHelp size={16} />
              </Tooltip>
            </div>
            <div className={showControls ? "" : "invisible"}>
              <span className="mx-2 text-gray-300">|</span>
              <ImageUploadLink
                label="Replace image"
                onFileSelect={({ imageDataUrl }) => {
                  activityEditorStore.setItemInfoImageDraftUrl({
                    itemId: item.id,
                    url: imageDataUrl,
                  });
                }}
              />
            </div>
          </div>
          <WysiwygEditor
            value={infoImage.textAlternative}
            setValue={(v) => {
              activityEditorStore.setItemInfoImageDraftTextAlternative({
                itemId: item.id,
                textAlternative: v,
              });
            }}
            disabled={!showControls}
          />
        </div>
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
