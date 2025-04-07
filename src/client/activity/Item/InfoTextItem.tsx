import { type InfoText } from "~/server/db/schema";
import { Editor } from "../../components/editor/Editor";
import { storeObserver } from "../../utils/storeObserver";
import { isInfoTextDraftReady } from "./itemValidator";

export const InfoTextItem = storeObserver<{
  infoText: InfoText;
}>(function InfoText({ infoText, draftStore }) {
  const isOk = isInfoTextDraftReady(infoText);

  return (
    <Editor
      value={infoText.content}
      onChange={(v) => {
        draftStore.updateDraft("infoTexts", { id: infoText.id, content: v });
      }}
      isOk={isOk}
    />
  );
});
