import { Collapse } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { LoadingPage } from "~/client/components/Loading";
import { LogoutButton } from "~/client/components/LogoutButton";
import { Page } from "~/client/components/Page";
import { type RichActivity } from "~/common/types";
import { trpc } from "~/trpc/proxy";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";
import { courseActivitiesKey, useCourseActivities } from "./courseActivities";
import { CreateActivityButton } from "./CreateActivityButton";
import { useStandaloneActivities } from "./standaloneActivities";

const standaloneActivitiesKey = "ad-hoc-activities";

export const Overview = storeObserver(function Overview({
  activitesStore,
  userStore,
}) {
  useEffect(() => {
    void activitesStore.fetch();
  }, [activitesStore]);
  const activities = activitesStore.data;

  const { item: courseActivitiesItem, courses } = useCourseActivities();

  const { user } = userStore;

  const router = useRouter();

  const onCreate = useCallback(
    async (title: string) => {
      const { activity, standaloneActivity, enrolledAs } =
        await trpc.activity.create.mutate({
          title,
        });
      const richActivity: RichActivity = {
        type: "standalone" as const,
        ...activity,
        standaloneActivity,
        enrolledAs,
      };
      activitesStore.setCache((activities) => {
        if (activities instanceof Status) {
          return activities;
        }
        return [...activities, richActivity];
      });
      router.push(`/activity/${activity.id}`);
    },
    [activitesStore, router],
  );

  const { item: standaloneActivitiesItem } = useStandaloneActivities(
    activities,
    onCreate,
  );

  if (
    activities instanceof Status ||
    user instanceof Status ||
    standaloneActivitiesItem instanceof Status ||
    courseActivitiesItem instanceof Status
  ) {
    return <LoadingPage />;
  }

  const items = [
    ...(standaloneActivitiesItem ? [standaloneActivitiesItem] : []),
    ...(courseActivitiesItem ? [courseActivitiesItem] : []),
  ];

  return (
    <Page>
      <div style={{ minWidth: 500 }} className="flex grow flex-col gap-4">
        <div className="mb-8 flex w-full justify-end">
          <LogoutButton />
        </div>
        {items.length > 0 ? (
          <div>
            <div className="mb-4 text-2xl">Activities</div>
            <Collapse
              accordion
              defaultActiveKey={
                !courses?.length
                  ? [standaloneActivitiesKey]
                  : courses?.length && !activities?.length
                    ? [courseActivitiesKey]
                    : undefined
              }
              items={items}
            />
          </div>
        ) : (
          <div className="flex grow flex-col items-center justify-center gap-4">
            <div
              className="text-center text-sm text-gray-500"
              style={{ width: 300 }}
            >
              Click to create a standalone activity :)
            </div>
            <CreateActivityButton onCreate={onCreate} />
            <div className="text-center text-sm text-gray-500">
              Coming soon: LMS connections
            </div>
          </div>
        )}
      </div>
    </Page>
  );
});
