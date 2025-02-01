"use client";

import { Typography } from "antd";
import { useState } from "react";
import { ActivityFrame } from "~/client/components/ActivityFrame";
import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { Status } from "~/common/status";
import { Item } from "./Item";
import { FooterControls } from "./FooterControls";

export const Activity = storeObserver(function Activity({
  activityStore,
  itemStore,
}) {
  const [showControlsRaw, setShowControls] = useState(true);

  const { activity } = activityStore;

  if (activity instanceof Status) {
    return <LoadingCentered />;
  }

  const teacherModeAvailable = (["teacher", "designer"] as const).some((v) =>
    activity.course.enrolledAs.includes(v),
  );

  const showControls = teacherModeAvailable && showControlsRaw;

  return (
    <ActivityFrame
      activityStatus={activity.status}
      teacherModeAvailable={teacherModeAvailable}
      showControls={showControlsRaw}
      setShowControls={setShowControls}
      header={<div className="mb-4 text-4xl">{activity.assignment.title}</div>}
      rows={itemStore.sortedItems.map((item, idx) => {
        const infoImage = itemStore.getInfoImage(item.id);
        const infoText = itemStore.getTextInfo(item.id);
        const question = itemStore.getQuestion(item.id);
        console.log(infoImage, infoText, question);
        return {
          main: (
            <Item
              item={item}
              deleted={activityStore.isDeleted(item.id)}
              teacherModeAvailable={teacherModeAvailable}
              showControls={showControls}
              infoImage={infoImage}
              infoText={infoText}
              question={question}
            />
          ),
          leftControl: (
            <div
              className={`flex flex-col items-center`}
              style={{ minWidth: 60 }}
            >
              <span>Item {idx + 1}</span>
              <Typography.Link
                onClick={() => activityStore.deleteDraft(item.id)}
                className="text-xs"
              >
                {activityStore.isDeleted(item.id) ? (
                  "Restore"
                ) : (
                  <span className="text-gray-500 hover:text-red-500">
                    Delete
                  </span>
                )}
              </Typography.Link>
            </div>
          ),
        };
      })}
      footerControls={<FooterControls />}
    />
  );
});
