import { type ActivityItemWithChildren } from "~/server/db/schema";

export function ActivityItem({
  activityItem,
}: {
  activityItem: ActivityItemWithChildren;
}) {
  return (
    <div>
      {activityItem.infoBlock && <div>{activityItem.infoBlock.content}</div>}
      {activityItem.question && (
        <div className="text-2xl">{activityItem.question.content}</div>
      )}
    </div>
  );
}
