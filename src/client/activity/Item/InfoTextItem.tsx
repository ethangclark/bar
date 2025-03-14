import { type InfoText } from "~/server/db/schema";
import { Editor } from "../../components/Editor";
import { storeObserver } from "../../utils/storeObserver";
import { isInfoTextDraftReady } from "./itemValidator";

export const InfoTextItem = storeObserver<{
  infoText: InfoText;
}>(function InfoText({ infoText, draftStore }) {
  const isOk = isInfoTextDraftReady(infoText);
  return (
    <div key={infoText.id} className="w-full">
      <Editor
        value={infoText.content}
        setValue={(v) => {
          draftStore.updateDraft("infoTexts", {
            id: infoText.id,
            content: v,
          });
        }}
        className={isOk ? "" : "placeholder-red-500"}
        placeholder="Insert text here..."
      />
    </div>
  );
});
