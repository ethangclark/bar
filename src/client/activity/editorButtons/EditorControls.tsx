import { Button, Modal } from "antd";
import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { invoke } from "~/common/fnUtils";
import { type Activity } from "~/server/db/schema";
import { InfoModalPadding } from "../../components/InfoModalPadding";
import { PublishButton } from "../PublishButton";

type EditorControlsProps = {
  activity: Activity;
};

const SaveButton = storeObserver<EditorControlsProps>(function SaveButton({
  activity,
  editorStore,
}) {
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  return (
    <div className="flex justify-center gap-2">
      <Modal
        open={confirmSaveOpen}
        onCancel={() => setConfirmSaveOpen(false)}
        onOk={() => {
          void editorStore.save();
        }}
        okText="Save"
      >
        <InfoModalPadding>
          Are you sure you want to publish these changes? This will make it
          visible to students.
        </InfoModalPadding>
      </Modal>
      <Button
        type="primary"
        disabled={!editorStore.canSave}
        onClick={() => {
          if (activity.status === "published") {
            setConfirmSaveOpen(true);
          } else {
            void editorStore.save();
          }
        }}
      >
        {invoke((): string => {
          switch (activity.status) {
            case "draft":
              return "Save";
            case "published":
              return "Save and publish";
          }
        })}
      </Button>
    </div>
  );
});

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
      </div>
    );
  },
);
