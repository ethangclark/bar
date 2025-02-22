import { storeObserver } from "~/client/utils/storeObserver";
import { draftNumericId } from "~/common/draftData";
import { ControlButton } from "./stores/ControlButton";

export const AddItemButtons = storeObserver(function AddItemButtons({
  activityDraftStore,
  itemStore,
}) {
  return (
    <div className="flex justify-center gap-2">
      <ControlButton
        onClick={() => {
          activityDraftStore.createDraft("infoTexts", {
            itemId: itemStore.createItem().id,
            content: "",
          });
        }}
      >
        + Add text
      </ControlButton>
      <ControlButton
        onClick={() => {
          activityDraftStore.createDraft("infoImages", {
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
          activityDraftStore.createDraft("infoVideos", {
            itemId: itemStore.createItem().id,
            numericId: draftNumericId,
            videoId: "",
            textAlternative: "",
          });
        }}
      >
        + Add video
      </ControlButton>
      <ControlButton
        onClick={() => {
          const q = activityDraftStore.createDraft("questions", {
            itemId: itemStore.createItem().id,
            content: "",
          });

          // we could generate suggestions for this
          activityDraftStore.createDraft("evalKeys", {
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
