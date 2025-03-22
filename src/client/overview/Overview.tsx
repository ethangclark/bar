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
import { useCourseActivities } from "./courseActivities";
import { NoActivites } from "./NoActivities";
import {
  createdActivitesKey,
  participatingActivitesKey,
  useStandaloneActivities,
} from "./standaloneActivities";

export const Overview = storeObserver(function Overview({
  activitesStore,
  userStore,
}) {
  useEffect(() => {
    void activitesStore.fetch();
  }, [activitesStore]);
  const activities = activitesStore.data;

  const { item: courseActivitiesItem } = useCourseActivities();

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

  const { created, participating } = useStandaloneActivities({
    activities,
    user,
    onCreate,
  });

  if (
    activities instanceof Status ||
    user instanceof Status ||
    created instanceof Status ||
    participating instanceof Status ||
    courseActivitiesItem instanceof Status
  ) {
    return <LoadingPage />;
  }

  const items = [
    ...(participating ? [participating] : []),
    ...(created ? [created] : []),
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
                participating
                  ? [participatingActivitesKey]
                  : created
                    ? [createdActivitesKey]
                    : undefined
              }
              items={items}
            />
          </div>
        ) : (
          <NoActivites onCreate={onCreate} />
        )}
      </div>
    </Page>
  );
});
