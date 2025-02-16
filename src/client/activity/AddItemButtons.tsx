import { storeObserver } from "~/client/utils/storeObserver";
import { draftNumericId } from "~/common/draftData";
import { ControlButton } from "./stores/ControlButton";

export const AddItemButtons = storeObserver(function AddItemButtons({
  activityEditorStore,
  itemStore,
}) {
  return (
    <div className="flex justify-center gap-2">
      <ControlButton
        onClick={() => {
          activityEditorStore.createDraft("infoTexts", {
            itemId: itemStore.createItem().id,
            content: "",
          });
        }}
      >
        + Add text
      </ControlButton>
      <ControlButton
        onClick={() => {
          activityEditorStore.createDraft("infoImages", {
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
          const q = activityEditorStore.createDraft("questions", {
            itemId: itemStore.createItem().id,
            content: "",
          });

          // we could generate suggestions for this
          activityEditorStore.createDraft("evalKeys", {
            questionId: q.id,
            key: "",
          });
        }}
      >
        + Add question
      </ControlButton>
    </div>
  );
});
