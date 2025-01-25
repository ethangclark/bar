"use client";

import { Button } from "antd";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { ActivityFrame } from "~/client/components/ActivityFrame";
import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { Status } from "~/common/utils/status";

const newItemOptions = [
  {
    type: "text",
    label: "+ Add text",
  },
  {
    type: "image",
    label: "+ Add an image",
  },
  {
    type: "question",
    label: "+ Add question",
  },
] as const;

const TeacherSection = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-lg border-2 border-dotted border-blue-500 p-1 ${className ?? ""}`}
  >
    {children}
  </div>
);

export const Activity = storeObserver(function Activity({
  activityEditorStore,
}) {
  const { savedActivity } = activityEditorStore;

  if (savedActivity instanceof Status) {
    return <LoadingCentered />;
  }

  return (
    <ActivityFrame
      extended={(["teacher", "designer"] as const).some((v) =>
        savedActivity.course.enrolledAs.includes(v),
      )}
      extendedHeader={<div>Toggle student view goes here</div>}
      header={
        <div className="mb-4 text-4xl">{savedActivity.assignment.title}</div>
      }
      rows={[
        {
          // (revisable) grading will be on the left
          main: <div>This be the student main of row 1</div>,
          right: (
            <TeacherSection>
              <div className="flex flex-col items-center text-gray-500">
                <ArrowUp size={20} />
                <GripVertical className="my-1" />
                <ArrowDown size={20} />
              </div>
            </TeacherSection>
          ),
        },
        {
          main: <div>This be the student main of row 2</div>,
        },
      ]}
      footer={
        <div className="my-4">
          <Button>Submit</Button>
        </div>
      }
      extendedFooter={
        <TeacherSection>
          {newItemOptions.map((option) => (
            <Button
              key={option.type}
              className="m-1"
              onClick={() => activityEditorStore.addDraftItem(option.type)}
            >
              {option.label}
            </Button>
          ))}
          <Button
            className="m-1"
            type="primary"
            disabled={activityEditorStore.canSave === false}
            onClick={() => activityEditorStore.saveActivity()}
          >
            Save
          </Button>
        </TeacherSection>
      }
    />
  );
});
