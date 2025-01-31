import { Button } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";

const newItemOptions = [
  {
    type: "text",
    label: "+ Add text",
  },
  {
    type: "image",
    label: "+ Add image",
  },
  {
    type: "question",
    label: "+ Add question",
  },
] as const;

export const FooterControls = storeObserver(function FooterControls({
  activityEditorStore,
}) {
  return (
    <div className="flex">
      {newItemOptions.map((option) => (
        <Button
          key={option.type}
          className="m-1"
          onClick={() => activityEditorStore.addDraftItem(option.type)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
});
