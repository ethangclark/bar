import { Button, type ButtonProps } from "antd";
import { storeObserver } from "~/client/utils/storeObserver";
import { invoke } from "~/common/fnUtils";
import { type ActivityStatus } from "~/server/db/schema";
import { TeacherSection } from "../components/TeacherSection";

type IgodControlsProps = {
  activityStatus: ActivityStatus;
};

function ControlButton(props: ButtonProps) {
  return <Button {...props} className={`w-full ${props.className ?? ""}`} />;
}

export const IgodControls = storeObserver<IgodControlsProps>(
  function IgodControls({
    activityStatus,
    activityEditorStore,
    studentModeStore,
    itemStore,
  }) {
    return (
      <div className="mr-3 flex h-full flex-col items-center">
        <TeacherSection className="flex flex-col items-center gap-2 p-3">
          <ControlButton
            type="primary"
            disabled={activityEditorStore.canSave === false}
            onClick={() => activityEditorStore.save()}
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
        </TeacherSection>
      </div>
    );
  },
);
