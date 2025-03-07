import { Button, Modal, type ButtonProps } from "antd";
import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { assertTypesExhausted } from "~/common/assertions";
import { invoke } from "~/common/fnUtils";
import { type Activity } from "~/server/db/schema";
import { InfoModalPadding } from "../components/InfoModalPadding";
import { LoadingCentered } from "../components/Loading";

type EditorControlsProps = {
  activity: Activity;
};

function ControlButton(props: ButtonProps) {
  return <Button {...props} className={`w-full ${props.className ?? ""}`} />;
}

export const EditorControls = storeObserver<EditorControlsProps>(
  function EditorControls({
    activity,
    editorStore,
    studentModeStore,
    focusedActivityStore,
  }) {
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
    const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
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
            Are you sure you want to publish this activity? This will make it
            visible to students.
          </InfoModalPadding>
        </Modal>
        <Modal
          open={confirmPublishOpen}
          onCancel={() => setConfirmPublishOpen(false)}
          onOk={async () => {
            setPublishing(true);
            try {
              await focusedActivityStore.publish();
            } finally {
              setPublishing(false);
              setConfirmPublishOpen(false);
            }
          }}
          okText="Publish"
        >
          <InfoModalPadding>
            Are you sure you want to publish this activity? This will make it
            visible to students.
          </InfoModalPadding>
          <div className={publishing ? "" : "invisible"}>
            <LoadingCentered />
          </div>
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
                return "Publish";
            }
          })}
        </ControlButton>
        {invoke(() => {
          switch (activity.status) {
            case "draft":
              return (
                <ControlButton
                  type="primary"
                  onClick={() => setConfirmPublishOpen(true)}
                  disabled={!editorStore.canPublish}
                >
                  Publish
                </ControlButton>
              );
            case "published":
              return null;
            default:
              assertTypesExhausted(activity.status);
          }
        })}
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
