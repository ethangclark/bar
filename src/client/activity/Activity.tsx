"use client";

import { Button } from "antd";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ActivityFrame } from "~/client/components/ActivityFrame";
import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { Status } from "~/common/utils/status";
import { FooterControls } from "./FooterControls";
import { ActivityItem } from "./ActivityItem";
import { useState } from "react";

export const Activity = storeObserver(function Activity({
  activityEditorStore,
}) {
  const { savedActivity, itemDrafts } = activityEditorStore;

  const [showControlsRaw, setShowControls] = useState(true);

  if (savedActivity instanceof Status || itemDrafts instanceof Status) {
    return <LoadingCentered />;
  }

  const teacherModeAvailable = (["teacher", "designer"] as const).some((v) =>
    savedActivity.course.enrolledAs.includes(v),
  );

  const showControls = teacherModeAvailable && showControlsRaw;

  return (
    <ActivityFrame
      teacherModeAvailable={teacherModeAvailable}
      showControls={showControlsRaw}
      setShowControls={setShowControls}
      header={
        <div className="mb-4 text-4xl">{savedActivity.assignment.title}</div>
      }
      rows={itemDrafts.map((item, idx) => ({
        main: <ActivityItem item={item} showControls={showControls} />,
        leftControl: (
          <div className={`flex flex-col items-center text-gray-500`}>
            <span>Item {idx + 1}</span>
            <ArrowUp size={20} />
            {/* <GripVertical className="my-1" /> */
            /* this would be wacky with our flex-grid -- need to be thoughtful if we implement non-incremental reordering */}
            <ArrowDown size={20} />
          </div>
        ),
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
