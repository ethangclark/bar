import { Button, Typography } from "antd";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Assignment } from "~/client/components/Assignment";
import { LoadingPage } from "~/client/components/Loading";
import { LogoutButton } from "~/client/components/LogoutButton";
import { Page } from "~/client/components/Page";
import { assertNever } from "~/common/errorUtils";
import { allIntegrationTypes, type RichActivity } from "~/common/types";
import { trpc } from "~/trpc/proxy";
import { api } from "~/trpc/react";
import { QueryStore } from "../utils/queryStore";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";
import { ConnectToCanvas } from "./ConnectToCanvas";

const SectionTitle = ({ title }: { title: string }) => (
  <div className="text-2xl">{title}</div>
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6">{children}</div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex w-full justify-between">{children}</div>
);

const activitesStore = new QueryStore(trpc.activity.getAll.query);

export const Overview = storeObserver(function Overview() {
  const { data: courses, isLoading: isLoadingCourses } =
    api.courses.all.useQuery();

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void activitesStore.fetch();
    return () => activitesStore.reset();
  }, []);

  const activities = activitesStore.data;

  if (isLoadingCourses || activities instanceof Status) {
    return <LoadingPage />;
  }

  return (
    <Page>
      <div>
        <div className="mb-8 flex w-full justify-end">
          <LogoutButton />
        </div>
        <Section>
          <SectionHeader>
            <SectionTitle title="Ad hoc activities" />
            <Button
              disabled={creating}
              onClick={async () => {
                setCreating(true);
                const { activity, adHocActivity } =
                  await trpc.activity.create.mutate({ title: "New activity" });
                const richActivity: RichActivity = {
                  type: "adHoc" as const,
                  ...activity,
                  adHocActivity,
                };
                activitesStore.setCache((activities) => {
                  if (activities instanceof Status) {
                    return activities;
                  }
                  return [...activities, richActivity];
                });
                setCreating(false);
              }}
            >
              Create activity
            </Button>
          </SectionHeader>
          <div className="flex flex-col gap-2">
            {activities?.map((activity) => {
              if (activity.type !== "adHoc") {
                return null;
              }
              return (
                <div
                  key={activity.id}
                  className="flex w-full items-center rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  <Typography.Link
                    href={`/activity/${activity.id}`}
                    className="grow px-3 py-1"
                  >
                    {activity.adHocActivity.title}
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
                          id: activity.id,
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
            })}
          </div>
        </Section>
        <Section>
          <SectionHeader>
            <SectionTitle title="Course activities" />
          </SectionHeader>
          <div className="mb-4 text-sm text-gray-500">
            To create activities for course assignments, connect to your LMS.
          </div>
          {courses?.map((c, idx) => (
            <div key={idx}>
              <div className="mb-4 text-4xl">{c.title}</div>
              <div>
                {c.assignments.map((a, idx) => {
                  return <Assignment key={idx} assignment={a} course={c} />;
                })}
              </div>
            </div>
          ))}
          <div className="flex w-full justify-center gap-4">
            {courses?.length === 0 &&
              allIntegrationTypes.map((it) => {
                switch (it) {
                  case "canvas":
                    return <ConnectToCanvas key={it} />;
                  default:
                    assertNever(it);
                }
              })}
          </div>
        </Section>
      </div>
    </Page>
  );
});
