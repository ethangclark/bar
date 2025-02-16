import { Button, Modal, type ButtonProps } from "antd";
import { useState } from "react";
import { storeObserver } from "~/client/utils/storeObserver";
import { draftNumericId } from "~/common/draftData";
import { invoke } from "~/common/fnUtils";
import { type ActivityStatus } from "~/server/db/schema";
import { ModalPadding } from "../components/ModalPadding";

type EditorControlsProps = {
  activityStatus: ActivityStatus;
};

function ControlButton(props: ButtonProps) {
  return <Button {...props} className={`w-full ${props.className ?? ""}`} />;
}

export const EditorControls = storeObserver<EditorControlsProps>(
  function EditorControls({
    activityStatus,
    activityEditorStore,
    studentModeStore,
    itemStore,
  }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    return (
      <div className="flex flex flex-col flex-col items-center gap-2">
        <Modal
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onOk={() => {
            void activityEditorStore.save();
          }}
          okText="Save"
        >
          <ModalPadding>
            Are you sure you want to publish this activity? This will make it
            visible to students.
          </ModalPadding>
        </Modal>
        <ControlButton
          type="primary"
          disabled={activityEditorStore.canSave === false}
          onClick={() => {
            if (activityStatus === "published") {
              setConfirmOpen(true);
            } else {
              void activityEditorStore.save();
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
          disabled={activityEditorStore.canSave}
        >
          See demo
        </ControlButton>
        <ControlButton
          onClick={() => {
            activityEditorStore.createDraft("infoTexts", {
              itemId: itemStore.createItem().id,
              content: "",
            });
          }}
        >
          + Add text
        </ControlButton>
        <ControlButton
          onClick={() => {
            activityEditorStore.createDraft("infoImages", {
              itemId: itemStore.createItem().id,
              url: "",
              textAlternative: "",
              numericId: draftNumericId,
            });
          }}
        >
          + Add image
        </ControlButton>
        <ControlButton
          onClick={() => {
            const q = activityEditorStore.createDraft("questions", {
              itemId: itemStore.createItem().id,
              content: "",
            });

            // we could generate suggestions for this
            activityEditorStore.createDraft("evalKeys", {
              questionId: q.id,
              key: "",
            });
          }}
        >
          + Add question
        </ControlButton>
      </div>
    );
  },
);
