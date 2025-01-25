"use client";

import { Button } from "antd";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ActivityFrame } from "~/client/components/ActivityFrame";
import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { Status } from "~/common/utils/status";
import { FooterControls } from "./FooterControls";
import { ActivityItem } from "./ActivityItem";
import { ActivityItemControls } from "./ActivityItemControls";

export const Activity = storeObserver(function Activity({
  activityEditorStore,
}) {
  const { savedActivity, itemDrafts } = activityEditorStore;

  if (savedActivity instanceof Status || itemDrafts instanceof Status) {
    return <LoadingCentered />;
  }

  const controls = (["teacher", "designer"] as const).some((v) =>
    savedActivity.course.enrolledAs.includes(v),
  )
    ? ({ enabled: true, toggleTitle: "Edit manually" } as const)
    : ({ enabled: false } as const);

  return (
    <ActivityFrame
      controls={controls}
      header={
        <div className="mb-4 text-4xl">{savedActivity.assignment.title}</div>
      }
      rows={itemDrafts.map((item) => ({
        main: <ActivityItem item={item} />,
        leftControl: (
          <div className={`flex flex-col items-center text-gray-500`}>
            <ArrowUp size={20} />
            {/* <GripVertical className="my-1" /> */
            /* this would be wacky with our flex-grid -- need to be thoughtful if we implement non-incremental reordering */}
            <ArrowDown size={20} />
          </div>
        ),
        rightControl: <ActivityItemControls item={item} />,
      }))}
      footer={
        <div className="my-4">
          <Button>Submit</Button>
        </div>
      }
      footerControls={<FooterControls />}
    />
  );
});
