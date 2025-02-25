import { storeObserver } from "~/client/utils/storeObserver";
import { draftNumericId } from "~/common/draftData";
import { ControlButton } from "./ControlButton";
import { UploadVideo } from "./Item/UploadVideo";

export const AddItemButtons = storeObserver(function AddItemButtons({
  descendentDraftStore,
  itemStore,
  videoUploadStore,
}) {
  const { isVideoUploading } = videoUploadStore;
  return (
    <div className="flex justify-center gap-2">
      <ControlButton
        disabled={isVideoUploading}
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
        disabled={isVideoUploading}
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
      <UploadVideo
        onUploadComplete={({ videoId }) => {
          descendentDraftStore.createDraft("infoVideos", {
            itemId: itemStore.createItem().id,
            numericId: draftNumericId,
            textAlternative: "",
            videoId,
          });
        }}
      >
        <ControlButton disabled={isVideoUploading}>+ Add video</ControlButton>
      </UploadVideo>
      <ControlButton
        disabled={isVideoUploading}
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
