import { type ActivityItemWithChildren } from "~/server/db/schema";
import { Editor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { storeObserver } from "../utils/storeObserver";
import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";

export const ActivityItem = storeObserver<{
  item: ActivityItemWithChildren;
}>(function ActivityItem({ item, activityEditorStore }) {
  return (
    <div className="flex flex-col items-center p-4" style={{ width: 400 }}>
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
          <div className="flex items-center text-sm text-gray-700">
            <div className="mr-1">Description</div>
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
            paddingCn="p-1"
            className="mx-[-4px] mb-4"
            outlineCn="focus:outline focus:outline-gray-200 rounded-none"
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
