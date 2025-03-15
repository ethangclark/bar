import { useMemo } from "react";
import { type RichActivity } from "~/common/types";
import { Status } from "../utils/status";
import { AdHocActivityItem } from "./AdHocActivityItem";
import { CreateActivityButton } from "./CreateActivityButton";

const adHocActivitiesKey = "ad-hoc-activities";

export function useAdHocActivities(
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
              key: adHocActivitiesKey,
              label: "Ad hoc activities",
              extra: <CreateActivityButton small onCreate={onCreate} />,
              children: (
                <div className="flex flex-col gap-2">
                  {activities.map((activity) => {
                    if (activity.type !== "adHoc") {
                      return null;
                    }
                    return (
                      <AdHocActivityItem
                        key={activity.id}
                        activity={activity}
                        adHocActivity={activity.adHocActivity}
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
