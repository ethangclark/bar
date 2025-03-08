import { Button } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";
import { draftNumericId } from "~/common/draftData";
import { trpc } from "~/trpc/proxy";
import { ImageUploadLink } from "../components/ImageUploader";
import { UploadVideo } from "./Item/UploadVideo";

export const AddItemButtons = storeObserver(function AddItemButtons({
  draftStore,
  itemStore,
  uploadStore,
}) {
  const { isSomethingUploading } = uploadStore;
  return (
    <div className="flex justify-center gap-2">
      <Button
        disabled={isSomethingUploading}
        onClick={() => {
          draftStore.createDraft("infoTexts", {
            itemId: itemStore.createItem().id,
            content: "",
          });
        }}
      >
        + Add text
      </Button>
      <ImageUploadLink
        onFileSelect={async ({ imageDataUrl }) => {
          const { uploadId } = uploadStore.noteUploadStarted();
          try {
            const description = await trpc.imageDescription.describe.mutate({
              imageDataUrl,
            });
            draftStore.createDraft("infoImages", {
              itemId: itemStore.createItem().id,
              url: imageDataUrl,
              textAlternative: description,
              numericId: draftNumericId,
            });
          } finally {
            uploadStore.noteUploadComplete({ uploadId });
          }
        }}
      >
        <Button disabled={isSomethingUploading}>+ Add image</Button>
      </ImageUploadLink>
      <UploadVideo
        onUploadComplete={({ videoId, transcript }) => {
          draftStore.createDraft("infoVideos", {
            itemId: itemStore.createItem().id,
            numericId: draftNumericId,
            textAlternative: transcript,
            videoId,
          });
        }}
      >
        <Button disabled={isSomethingUploading}>+ Add video</Button>
      </UploadVideo>
      <Button
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
      </Button>
    </div>
  );
});
