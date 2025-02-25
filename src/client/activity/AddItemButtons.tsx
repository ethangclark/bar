import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { draftNumericId } from "~/common/draftData";
import { LoadingCentered } from "../components/Loading";
import { ControlButton } from "./ControlButton";
import { UploadVideo } from "./Item/UploadVideo";

export const AddItemButtons = storeObserver(function AddItemButtons({
  descendentDraftStore,
  itemStore,
}) {
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  return (
    <div className="flex justify-center gap-2">
      <ControlButton
        disabled={isUploadingVideo}
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
        disabled={isUploadingVideo}
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
        onUploadStarted={() => setIsUploadingVideo(true)}
        onUploadComplete={({ videoId }) => {
          descendentDraftStore.createDraft("infoVideos", {
            itemId: itemStore.createItem().id,
            numericId: draftNumericId,
            textAlternative: "",
            videoId,
          });
          setIsUploadingVideo(false);
        }}
      >
        <ControlButton disabled={isUploadingVideo}>
          <div className="relative">
            + Add video
            {isUploadingVideo && (
              <div className="absolute inset-0">
                <LoadingCentered />
              </div>
            )}
          </div>
        </ControlButton>
      </UploadVideo>
      <ControlButton
        disabled={isUploadingVideo}
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
