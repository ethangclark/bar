"use client";

import { Typography } from "antd";
import { useState } from "react";
import { ActivityFrame } from "~/client/components/ActivityFrame";
import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { Status } from "~/common/status";
import { Item } from "./Item";
import { FooterControls } from "./FooterControls";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";

export const Activity = storeObserver(function Activity({
  activityStore,
  itemStore,
}) {
  const [showControlsRaw, setShowControls] = useState(true);

  const { activity } = activityStore;
  const { sortedItems } = itemStore;

  if (activity instanceof Status || sortedItems instanceof Status) {
    return <LoadingCentered />;
  }

  const igod = isGraderOrDeveloper(activity.course.enrolledAs);
  const showControls = igod && showControlsRaw;

  return (
    <ActivityFrame
      activityStatus={activity.status}
      enrolledAs={activity.course.enrolledAs}
      showControls={showControlsRaw}
      setShowControls={setShowControls}
      header={<div className="mb-4 text-4xl">{activity.assignment.title}</div>}
      rows={sortedItems.map((item, idx) => {
        const infoImage = itemStore.getInfoImage(item.id);
        const infoText = itemStore.getTextInfo(item.id);
        const question = itemStore.getQuestion(item.id);
        return {
          main: (
            <Item
              item={item}
              deleted={activityStore.isDeleted(item.id)}
              enrolledAs={activity.course.enrolledAs}
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
