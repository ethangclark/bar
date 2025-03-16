import { useMemo } from "react";
import { type RichActivity } from "~/common/types";
import { Status } from "../utils/status";
import { CreateActivityButton } from "./CreateActivityButton";
import { StandaloneActivityItem } from "./StandaloneActivityItem";

const standaloneActivitiesKey = "ad-hoc-activities";

export function useStandaloneActivities(
  activities: RichActivity[] | Status,
  onCreate: (title: string) => Promise<void>,
) {
  const item = useMemo(
    () =>
      activities instanceof Status
        ? activities
        : !activities.length
          ? null
          : {
              key: standaloneActivitiesKey,
              label: "Standalone activities",
              extra: <CreateActivityButton small onCreate={onCreate} />,
              children: (
                <div className="flex flex-col gap-2">
                  {activities.map((activity) => {
                    if (activity.type !== "standalone") {
                      return null;
                    }
                    return (
                      <StandaloneActivityItem
                        key={activity.id}
                        activity={activity}
                        standaloneActivity={activity.standaloneActivity}
                      />
                    );
                  })}
                </div>
              ),
            },
    [activities, onCreate],
  );

  return { item };
}
