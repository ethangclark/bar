import { type ActivityItemWithChildren } from "~/server/db/schema";
import { storeObserver } from "../utils/storeObserver";
import { Editor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";

export const ActivityItem = storeObserver<{
  item: ActivityItemWithChildren;
}>(function ActivityItem({ item, activityEditorStore }) {
  return (
    <div>
      {item.infoImages.map((infoImage) => (
        <div key={infoImage.id}>
          <ImageFromDataUrl
            alt={infoImage.textAlternative}
            src={infoImage.url}
          />
          <Editor
            value={infoImage.textAlternative}
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
