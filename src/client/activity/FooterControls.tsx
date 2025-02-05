import { Button, type ButtonProps } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";

function FooterButton(props: ButtonProps) {
  return <Button className="m-1" {...props} />;
}

export const FooterControls = storeObserver(function FooterControls({
  activityEditorStore,
  itemStore,
}) {
  return (
    <div className="flex">
      <FooterButton
        onClick={() => {
          activityEditorStore.createDraft("infoTexts", {
            itemId: itemStore.createItem().id,
            content: "",
          });
        }}
      >
        + Add text
      </FooterButton>
      <FooterButton
        onClick={() => {
          activityEditorStore.createDraft("infoImages", {
            itemId: itemStore.createItem().id,
            url: "",
            textAlternative: "",
          });
        }}
      >
        + Add image
      </FooterButton>
      <FooterButton
        onClick={() => {
          const q = activityEditorStore.createDraft("questions", {
            itemId: itemStore.createItem().id,
            content: "",
          });

          // TODO: could generate suggestions for this
          activityEditorStore.createDraft("evalKeys", {
            questionId: q.id,
            key: "",
          });
        }}
      >
        + Add question
      </FooterButton>
    </div>
  );
});
