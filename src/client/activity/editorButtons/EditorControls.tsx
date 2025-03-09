import { Dropdown } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";
import { type Activity } from "~/server/db/schema";
import { SharingOptions } from "../SharingOptions";
import { SaveButton } from "./SaveButton";

type EditorControlsProps = {
  activity: Activity;
};

export const EditorControls = storeObserver<EditorControlsProps>(
  function EditorControls({ activity, editorStore, viewModeStore }) {
    return (
      <div className="flex justify-center gap-2">
        <SaveButton activity={activity} />
        <Dropdown.Button
          menu={{
            items: [
              {
                key: "student-view",
                label: "Student view",
                onClick: () => viewModeStore.setViewMode("doer"),
                disabled: !editorStore.canDemo,
              },
              {
                key: "submissions",
                label: "Submissions",
                onClick: () => viewModeStore.setViewMode("submissions"),
              },
            ],
          }}
        >
          View
        </Dropdown.Button>
        <SharingOptions activity={activity} />
      </div>
    );
  },
);
