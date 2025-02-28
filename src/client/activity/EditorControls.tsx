import { Button, Modal, type ButtonProps } from "antd";
import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { invoke } from "~/common/fnUtils";
import { type ActivityStatus } from "~/server/db/schema";
import { InfoModalPadding } from "../components/InfoModalPadding";

type EditorControlsProps = {
  activityStatus: ActivityStatus;
};

function ControlButton(props: ButtonProps) {
  return <Button {...props} className={`w-full ${props.className ?? ""}`} />;
}

export const EditorControls = storeObserver<EditorControlsProps>(
  function EditorControls({ activityStatus, editorStore, studentModeStore }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    return (
      <div className="flex justify-center gap-2">
        <Modal
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onOk={() => {
            void editorStore.save();
          }}
          okText="Save"
        >
          <InfoModalPadding>
            Are you sure you want to publish this activity? This will make it
            visible to students.
          </InfoModalPadding>
        </Modal>
        <ControlButton
          type="primary"
          disabled={!editorStore.canSave}
          onClick={() => {
            if (activityStatus === "published") {
              setConfirmOpen(true);
            } else {
              void editorStore.save();
            }
          }}
        >
          {invoke((): string => {
            switch (activityStatus) {
              case "draft":
                return "Save";
              case "published":
                return "Publish";
            }
          })}
        </ControlButton>
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
