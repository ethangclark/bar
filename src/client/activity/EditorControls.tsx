import { Button, Modal, type ButtonProps } from "antd";
import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { invoke } from "~/common/fnUtils";
import { type Activity } from "~/server/db/schema";
import { InfoModalPadding } from "../components/InfoModalPadding";
import { PublishButton } from "./PublishButton";

type EditorControlsProps = {
  activity: Activity;
};

function ControlButton(props: ButtonProps) {
  return <Button {...props} className={`w-full ${props.className ?? ""}`} />;
}

export const EditorControls = storeObserver<EditorControlsProps>(
  function EditorControls({ activity, editorStore, studentModeStore }) {
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
        <ControlButton
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
                return "Publish changes";
            }
          })}
        </ControlButton>
        <PublishButton activity={activity} />
        <ControlButton
          type="primary"
          onClick={() => studentModeStore.setIsStudentMode(true)}
          disabled={!editorStore.canDemo}
        >
          Student view
        </ControlButton>
      </div>
    );
  },
);
