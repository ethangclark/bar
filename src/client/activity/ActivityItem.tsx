import { type ActivityItemWithChildren } from "~/server/db/schema";
import { storeObserver } from "../utils/storeObserver";
import { Editor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { ImageUploader } from "../components/ImageUploader";

const maxImgWidth = 400;

export const ActivityItem = storeObserver<{
  item: ActivityItemWithChildren;
}>(function ActivityItem({ item, activityEditorStore }) {
  return (
    <div>
      {item.infoImages.map((infoImage) => (
        <div key={infoImage.id} className="flex flex-col items-center">
          <div className="flex">
            <div
              className="flex flex-col items-center"
              style={{ width: maxImgWidth }}
            >
              <ImageFromDataUrl
                alt={infoImage.textAlternative}
                src={infoImage.url}
                style={{
                  maxWidth: maxImgWidth,
                  maxHeight: 300,
                  marginBottom: 16,
                }}
              />
              <ImageUploader
                onFileSelect={({ imageDataUrl }) => {
                  console.log({ imageDataUrl });
                  activityEditorStore.setItemInfoImageDraftUrl({
                    itemId: item.id,
                    url: imageDataUrl,
                  });
                }}
              />
            </div>
            <div className="p-4" style={{ width: maxImgWidth }}>
              <div>Text alternative:</div>
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
          </div>
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
