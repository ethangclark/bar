import { Button, type ButtonProps } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";

function FooterButton(props: ButtonProps) {
  return <Button className="m-1" {...props} />;
}

export const FooterControls = storeObserver(function FooterControls({
  activityStore,
  itemStore,
}) {
  return (
    <div className="flex">
      <FooterButton
        onClick={() => {
          activityStore.createDraft("infoTexts", {
            itemId: itemStore.createItem().id,
            content: "",
          });
        }}
      >
        + Add text
      </FooterButton>
      <FooterButton
        onClick={() => {
          activityStore.createDraft("infoImages", {
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
          activityStore.createDraft("questions", {
            itemId: itemStore.createItem().id,
            content: "",
          });
        }}
      >
        + Add question
      </FooterButton>
    </div>
  );
});
