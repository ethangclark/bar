import { storeObserver } from "~/client/utils/storeObserver";
import { draftNumericId } from "~/common/draftData";
import { ControlButton } from "./ControlButton";
import { UploadVideo } from "./Item/UploadVideo";

export const AddItemButtons = storeObserver(function AddItemButtons({
  draftStore,
  itemStore,
  uploadStore,
}) {
  const { isSomethingUploading } = uploadStore;
  return (
    <div className="flex justify-center gap-2">
      <ControlButton
        disabled={isSomethingUploading}
        onClick={() => {
          draftStore.createDraft("infoTexts", {
            itemId: itemStore.createItem().id,
            content: "",
          });
        }}
      >
        + Add text
      </ControlButton>
      <ControlButton
        disabled={isSomethingUploading}
        onClick={() => {
          draftStore.createDraft("infoImages", {
            itemId: itemStore.createItem().id,
            url: "",
            textAlternative: "",
            numericId: draftNumericId,
          });
        }}
      >
        + Add image
      </ControlButton>
      <UploadVideo
        onUploadComplete={({ videoId }) => {
          draftStore.createDraft("infoVideos", {
            itemId: itemStore.createItem().id,
            numericId: draftNumericId,
            textAlternative: "",
            videoId,
          });
        }}
      >
        <ControlButton disabled={isSomethingUploading}>
          + Add video
        </ControlButton>
      </UploadVideo>
      <ControlButton
        disabled={isSomethingUploading}
        onClick={() => {
          const q = draftStore.createDraft("questions", {
            itemId: itemStore.createItem().id,
            content: "",
          });

          // we could generate suggestions for this
          draftStore.createDraft("evalKeys", {
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
