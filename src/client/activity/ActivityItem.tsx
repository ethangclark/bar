import { type ActivityItemWithChildren } from "~/server/db/schema";
import { WysiwygEditor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { storeObserver } from "../utils/storeObserver";
import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { ImageUploadLink } from "../components/ImageUploader";

export const ActivityItem = storeObserver<{
  item: ActivityItemWithChildren;
  deleted: boolean;
  teacherModeAvailable: boolean;
  showControls: boolean;
}>(function ActivityItem({
  item,
  deleted,
  teacherModeAvailable,
  showControls,
  activityEditorStore,
}) {
  return (
    <div
      className={`flex flex-col items-center px-4 pb-8 ${deleted ? "opacity-30" : ""}`}
      style={{ width: 500 }}
    >
      {item.infoImages.map((infoImage) => (
        <div key={infoImage.id} className="w-full">
          <ImageFromDataUrl
            alt={infoImage.url ? infoImage.textAlternative : "Missing image"}
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
            disabled={!teacherModeAvailable}
            setValue={(v) => {
              activityEditorStore.setItemInfoImageDraftTextAlternative({
                itemId: item.id,
                textAlternative: v,
              });
            }}
          />
        </div>
      ))}
      {item.infoTexts.map((infoText) => (
        <div key={infoText.id} className="w-full">
          <WysiwygEditor
            value={infoText.content}
            disabled={!teacherModeAvailable}
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
        <div key={question.id} className="w-full">
          <WysiwygEditor
            value={question.content}
            disabled={!teacherModeAvailable}
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
