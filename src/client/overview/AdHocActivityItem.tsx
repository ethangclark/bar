import { Button, Typography } from "antd";
import { Trash2 } from "lucide-react";
import { type Activity, type AdHocActivity } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

export const itemTextClassName = "grow px-3 py-1";

export const AdHocActivityItem = storeObserver<{
  activity: Activity;
  adHocActivity: AdHocActivity;
}>(function AdHocActivity({ activity, adHocActivity, activitesStore }) {
  return (
    <div
      key={activity.id}
      className="flex w-full items-center rounded-md border border-gray-200 hover:bg-gray-50 hover:bg-gray-50"
    >
      <Typography.Link
        href={`/activity/${activity.id}`}
        className={itemTextClassName}
      >
        {adHocActivity.title}
      </Typography.Link>
      <Button
        type="text"
        icon={<Trash2 size={16} />}
        onClick={async () => {
          if (
            confirm(
              "Are you sure you want to delete this activity? This will delete the activity and all associated data, and it cannot be undone.",
            )
          ) {
            await trpc.activity.deleteAdHocActivity.mutate({
              activityId: activity.id,
            });
            activitesStore.setCache((activities) => {
              if (activities instanceof Status) {
                return activities;
              }
              return activities.filter((a) => a.id !== activity.id);
            });
          }
        }}
      />
    </div>
  );
});
