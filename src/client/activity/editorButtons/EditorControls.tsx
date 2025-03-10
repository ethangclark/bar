import { storeObserver } from "~/client/utils/storeObserver";
import { type Activity } from "~/server/db/schema";
import { SaveButton } from "./SaveButton";
import { SharingOptions } from "./SharingOptions";
import { ViewsButton } from "./ViewsButton";

type EditorControlsProps = {
  activity: Activity;
};

export const EditorControls = storeObserver<EditorControlsProps>(
  function EditorControls({ activity }) {
    return (
      <div className="flex justify-center gap-2">
        <SaveButton activity={activity} />
        <ViewsButton />
        <SharingOptions activity={activity} />
      </div>
    );
  },
);
