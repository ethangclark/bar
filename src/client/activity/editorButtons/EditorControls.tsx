import { Button } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";
import { type Activity } from "~/server/db/schema";
import { PublishButton } from "../PublishButton";
import { ActivityLink } from "./ActivityLink";
import { SaveButton } from "./SaveButton";

type EditorControlsProps = {
  activity: Activity;
};

export const EditorControls = storeObserver<EditorControlsProps>(
  function EditorControls({ activity, editorStore, studentModeStore }) {
    return (
      <div className="flex justify-center gap-2">
        <SaveButton activity={activity} />
        <PublishButton activity={activity} />
        <Button
          onClick={() => studentModeStore.setIsStudentMode(true)}
          disabled={!editorStore.canDemo}
        >
          Student view
        </Button>
        <ActivityLink />
      </div>
    );
  },
);
