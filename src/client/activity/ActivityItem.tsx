import { type ActivityItemWithChildren } from "~/server/db/schema";

export function ActivityItem({
  activityItem,
}: {
  activityItem: ActivityItemWithChildren;
}) {
  if (activityItem.question) {
    return <div>{activityItem.question.content}</div>;
  }
  if (activityItem.infoText) {
    return <div>{activityItem.infoText.content}</div>;
  }
  if (activityItem.infoImage) {
    return <div>{activityItem.infoImage.url}</div>;
  }
  return null;
}
