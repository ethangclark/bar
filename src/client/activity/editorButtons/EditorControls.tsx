import { Button } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";
import { type Activity } from "~/server/db/schema";
import { SharingOptions } from "../SharingOptions";
import { SaveButton } from "./SaveButton";

type EditorControlsProps = {
  activity: Activity;
};

export const EditorControls = storeObserver<EditorControlsProps>(
  function EditorControls({ activity, editorStore, studentModeStore }) {
    return (
      <div className="flex justify-center gap-2">
        <SaveButton activity={activity} />
        <Button
          onClick={() => studentModeStore.setIsStudentMode(true)}
          disabled={!editorStore.canDemo}
        >
          Student view
        </Button>
        <SharingOptions activity={activity} />
      </div>
    );
  },
);
