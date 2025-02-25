import { storeObserver } from "~/client/utils/storeObserver";
import { draftNumericId } from "~/common/draftData";
import { ControlButton } from "./ControlButton";

export const AddItemButtons = storeObserver(function AddItemButtons({
  descendentDraftStore,
  itemStore,
}) {
  return (
    <div className="flex justify-center gap-2">
      <ControlButton
        onClick={() => {
          descendentDraftStore.createDraft("infoTexts", {
            itemId: itemStore.createItem().id,
            content: "",
          });
        }}
      >
        + Add text
      </ControlButton>
      <ControlButton
        onClick={() => {
          descendentDraftStore.createDraft("infoImages", {
            itemId: itemStore.createItem().id,
            url: "",
            textAlternative: "",
            numericId: draftNumericId,
          });
        }}
      >
        + Add image
      </ControlButton>
      <ControlButton
        onClick={() => {
          descendentDraftStore.createDraft("infoVideos", {
            itemId: itemStore.createItem().id,
            numericId: draftNumericId,
            textAlternative: "",
          });
        }}
      >
        + Add video
      </ControlButton>
      <ControlButton
        onClick={() => {
          const q = descendentDraftStore.createDraft("questions", {
            itemId: itemStore.createItem().id,
            content: "",
          });

          // we could generate suggestions for this
          descendentDraftStore.createDraft("evalKeys", {
            questionId: q.id,
            content: "",
          });
        }}
      >
        + Add question
      </ControlButton>
    </div>
  );
});
