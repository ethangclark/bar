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
import { useAdHocActivities } from "./adHocActivities";
import { courseActivitiesKey, useCourseActivities } from "./courseActivities";
import { CreateActivityButton } from "./CreateActivityButton";

const adHocActivitiesKey = "ad-hoc-activities";

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
      const { activity, adHocActivity, enrolledAs } =
        await trpc.activity.create.mutate({
          title,
        });
      const richActivity: RichActivity = {
        type: "adHoc" as const,
        ...activity,
        adHocActivity,
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

  const { item: adHocActivitiesItem } = useAdHocActivities(
    activities,
    onCreate,
  );

  if (
    activities instanceof Status ||
    user instanceof Status ||
    adHocActivitiesItem instanceof Status ||
    courseActivitiesItem instanceof Status
  ) {
    return <LoadingPage />;
  }

  const items = [
    ...(adHocActivitiesItem ? [adHocActivitiesItem] : []),
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
            <div className="mb-4 text-2xl">Your activities</div>
            <Collapse
              accordion
              defaultActiveKey={
                !courses?.length
                  ? [adHocActivitiesKey]
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
