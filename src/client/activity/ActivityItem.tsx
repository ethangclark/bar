import { type ActivityItemWithChildren } from "~/server/db/schema";
import { Editor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { storeObserver } from "../utils/storeObserver";

export const ActivityItem = storeObserver<{
  item: ActivityItemWithChildren;
}>(function ActivityItem({ item, activityEditorStore }) {
  return (
    <div className="flex flex-col items-center p-4" style={{ width: 400 }}>
      {item.infoImages.map((infoImage) => (
        <ImageFromDataUrl
          key={infoImage.id}
          alt={"Upload an image to include in activity"}
          src={infoImage.url}
          style={{
            maxWidth: "100%",
            marginBottom: 16,
          }}
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
