import { Button, type ButtonProps } from "antd";
import { generateKeyBetween } from "fractional-indexing";
import { useCallback } from "react";
import { storeObserver } from "~/client/utils/storeObserver";

function FooterButton(props: ButtonProps) {
  return <Button className="m-1" {...props} />;
}

export const FooterControls = storeObserver(function FooterControls({
  activityEditorStore,
}) {
  const createItem = useCallback(() => {
    const items = activityEditorStore.sortedItems;
    const item = activityEditorStore.createDraft("activityItems", {
      orderFracIdx: generateKeyBetween(
        items.slice(-1)[0]?.orderFracIdx ?? null,
        null,
      ),
    });
    return item;
  }, [activityEditorStore]);

  return (
    <div className="flex">
      <FooterButton
        onClick={() => {
          activityEditorStore.createDraft("infoTexts", {
            activityItemId: createItem().id,
            content: "",
          });
        }}
      >
        + Add text
      </FooterButton>
      <FooterButton
        onClick={() => {
          activityEditorStore.createDraft("infoImages", {
            activityItemId: createItem().id,
            url: "",
            textAlternative: "",
          });
        }}
      >
        + Add image
      </FooterButton>
      <FooterButton
        onClick={() => {
          activityEditorStore.createDraft("questions", {
            activityItemId: createItem().id,
            content: "",
          });
        }}
      >
        + Add question
      </FooterButton>
    </div>
  );
});
