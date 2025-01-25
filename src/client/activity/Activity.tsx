"use client";

import { Button, Typography } from "antd";
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
      activityStatus={savedActivity.status}
      teacherModeAvailable={teacherModeAvailable}
      showControls={showControlsRaw}
      setShowControls={setShowControls}
      header={
        <div className="mb-4 text-4xl">{savedActivity.assignment.title}</div>
      }
      rows={itemDrafts.map((item, idx) => ({
        main: (
          <ActivityItem
            item={item}
            deleted={item.deleted}
            teacherModeAvailable={teacherModeAvailable}
            showControls={showControls}
          />
        ),
        leftControl: (
          <div
            className={`flex flex-col items-center`}
            style={{ minWidth: 60 }}
          >
            <span>Item {idx + 1}</span>
            <Typography.Link
              onClick={() =>
                activityEditorStore.setItemDraftDeletion({
                  itemId: item.id,
                  deleted: !item.deleted,
                })
              }
              className="text-xs"
            >
              {item.deleted ? (
                "Restore"
              ) : (
                <span className="text-red-500 hover:text-red-700">Delete</span>
              )}
            </Typography.Link>
          </div>
        ),
      }))}
      footerControls={<FooterControls />}
    />
  );
});
