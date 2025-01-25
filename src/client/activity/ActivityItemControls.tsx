import {
  type ActivityItemWithChildren,
  type InfoImage,
} from "~/server/db/schema";
import { Editor } from "../components/Editor";
import { storeObserver } from "../utils/storeObserver";
import { RowBox } from "./RowBox";

const InfoImageControls = storeObserver<{
  item: ActivityItemWithChildren;
  infoImage: InfoImage;
}>(function InfoImageControls({ activityEditorStore, item, infoImage }) {
  return (
    <RowBox>
      <Editor
        value={infoImage.textAlternative}
        setValue={(v) => {
          activityEditorStore.setItemInfoImageDraftTextAlternative({
            itemId: item.id,
            textAlternative: v,
          });
        }}
        flexGrow={1}
      />
    </RowBox>
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
