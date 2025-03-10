import { Button, Dropdown, Typography, type MenuProps } from "antd";
import { MoreVertical } from "lucide-react";
import { type Activity, type AdHocActivity } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

export const AdHocActivityItem = storeObserver<{
  activity: Activity;
  adHocActivity: AdHocActivity;
}>(function AdHocActivity({ activity, adHocActivity, activitesStore }) {
  const handleDelete = async () => {
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
  };

  const dropdownItems: MenuProps["items"] = [
    {
      key: "delete",
      label: "Delete",
      danger: true,
      onClick: () => void handleDelete(),
    },
  ];

  return (
    <div
      key={activity.id}
      className="ml-[-12px] flex w-full items-center rounded-md hover:bg-gray-50" // if changing ml, change pl below correspondingly
    >
      <Typography.Link
        href={`/activity/${activity.id}`}
        className={"mr-12 grow py-1 pl-3"} // if changing pl, change ml above correspondingly
      >
        {adHocActivity.title}
      </Typography.Link>
      <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
        <Button type="text" icon={<MoreVertical size={16} />} />
      </Dropdown>
    </div>
  );
});
