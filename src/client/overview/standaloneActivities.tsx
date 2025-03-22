import { useMemo } from "react";
import { invoke } from "~/common/fnUtils";
import { type RichActivity, type UserBasic } from "~/common/types";
import { type CompletionTotals } from "~/server/api/routers/submissionRouter";
import { isStatus, type Status } from "../utils/status";
import { CreateActivityButton } from "./CreateActivityButton";
import { StandaloneActivityItem } from "./StandaloneActivityItem";

export const createdActivitesKey = "created-activities";
export const participatingActivitesKey = "participating-activities";

export function useStandaloneActivities({
  activities,
  user,
  onCreate,
  completionTotals,
}: {
  activities: RichActivity[] | Status;
  user: UserBasic | Status;
  onCreate: (title: string) => Promise<void>;
  completionTotals: CompletionTotals | Status;
}) {
  const userId = isStatus(user) ? user : user.id;
  const isInstructor = isStatus(user) ? false : user.isInstructor;
  const created = useMemo(() => {
    if (isStatus(activities)) {
      return activities;
    }
    const filtered = activities.filter(
      (a) =>
        a.type === "standalone" && a.standaloneActivity.creatorId === userId,
    );
    if (!filtered.length || !isInstructor) {
      return null;
    }
    return {
      key: createdActivitesKey,
      label: "Created",
      extra: <CreateActivityButton small onCreate={onCreate} />,
      children: (
        <div className="flex flex-col gap-2">
          {filtered.map((activity) => {
            if (activity.type !== "standalone") {
              return null;
            }
            return (
              <StandaloneActivityItem
                key={activity.id}
                activity={activity}
                standaloneActivity={activity.standaloneActivity}
                percentCompleted={null}
              />
            );
          })}
        </div>
      ),
    };
  }, [activities, isInstructor, onCreate, userId]);

  const participating = useMemo(() => {
    if (isStatus(activities)) {
      return activities;
    }
    const filtered = activities.filter(
      (a) =>
        a.type === "standalone" && a.standaloneActivity.creatorId !== userId,
    );
    if (!filtered.length) {
      return null;
    }
    return {
      key: participatingActivitesKey,
      label: "Participating",
      children: (
        <div className="flex flex-col gap-2">
          {filtered.map((activity) => {
            if (activity.type !== "standalone") {
              return null;
            }
            const percentCompleted = invoke(() => {
              if (isStatus(completionTotals)) {
                return completionTotals;
              }
              const totals = completionTotals[activity.id];
              if (!totals) {
                return 0;
              }
              return Math.floor(
                (totals.completionCount / totals.itemCount) * 100,
              );
            });
            return (
              <StandaloneActivityItem
                key={activity.id}
                activity={activity}
                standaloneActivity={activity.standaloneActivity}
                percentCompleted={percentCompleted}
              />
            );
          })}
        </div>
      ),
    };
  }, [activities, completionTotals, userId]);

  return { created, participating };
}
