import { Button, Dropdown, Progress, type MenuProps } from "antd";
import { MoreVertical } from "lucide-react";
import {
  enrollmentTypeColorClassName,
  enrollmentTypeLabel,
  isDeveloper,
  type EnrollmentType,
} from "~/common/enrollmentTypeUtils";
import { type RichActivity } from "~/common/types";
import { type StandaloneActivity } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";
import { LinkX } from "../components/Link";
import { LoadingNotCentered } from "../components/Loading";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

function EnrolledAsLabel({ enrolledAs }: { enrolledAs: EnrollmentType[] }) {
  if (enrolledAs.length === 1 && enrolledAs.includes("student")) {
    return null;
  }
  const reduced = enrolledAs.includes("teacher")
    ? ["teacher" as const]
    : enrolledAs;
  return (
    <div className="rounded-md border border-gray-300 px-1 py-0.5 text-xs">
      {reduced.map((e) => (
        <span key={e} className={enrollmentTypeColorClassName(e)}>
          {enrollmentTypeLabel(e)}
        </span>
      ))}
    </div>
  );
}

export const StandaloneActivityItem = storeObserver<{
  activity: RichActivity;
  standaloneActivity: StandaloneActivity;
  percentCompleted: number | Status | null;
}>(function StandaloneActivity({
  activity,
  standaloneActivity,
  activitesStore,
  percentCompleted,
}) {
  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this activity? This will delete the activity and all associated data, and it cannot be undone.",
      )
    ) {
      await trpc.activity.deleteStandaloneActivity.mutate({
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
      className="flex w-full items-center rounded-md hover:bg-gray-50"
    >
      <LinkX
        href={`/activity/${activity.id}`}
        className={"mr-12 grow py-1 pl-3"}
      >
        {standaloneActivity.title}
      </LinkX>
      <div className="mx-2">
        {percentCompleted === null ? null : percentCompleted instanceof
          Status ? (
          <LoadingNotCentered />
        ) : (
          <Progress percent={percentCompleted} />
        )}
      </div>
      <EnrolledAsLabel enrolledAs={activity.enrolledAs} />
      {isDeveloper(activity.enrolledAs) && (
        <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
          <Button type="text" icon={<MoreVertical size={16} />} />
        </Dropdown>
      )}
    </div>
  );
});
