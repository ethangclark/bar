import { type InfoText } from "~/server/db/schema";
import { Editor } from "../../components/Editor";
import { storeObserver } from "../../utils/storeObserver";

export const InfoTextItem = storeObserver<{
  infoText: InfoText;
}>(function InfoText({ infoText, descendentDraftStore }) {
  return (
    <div key={infoText.id} className="w-full">
      <Editor
        value={infoText.content}
        setValue={(v) => {
          descendentDraftStore.updateDraft("infoTexts", {
            id: infoText.id,
            content: v,
          });
        }}
        className={infoText.content ? "" : "placeholder-red-500"}
        placeholder="Insert text here..."
      />
    </div>
  );
});
