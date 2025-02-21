import { Button, Form, Input, Modal } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Assignment } from "~/client/components/Assignment";
import { LoadingPage } from "~/client/components/Loading";
import { LogoutButton } from "~/client/components/LogoutButton";
import { Page } from "~/client/components/Page";
import { assertNever } from "~/common/errorUtils";
import { allIntegrationTypes, type RichActivity } from "~/common/types";
import { trpc } from "~/trpc/proxy";
import { api } from "~/trpc/react";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";
import { AdHocActivityItem } from "./AdHocActivityItem";
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

export const Overview = storeObserver(function Overview({ activitesStore }) {
  const { data: courses, isLoading: isLoadingCourses } =
    api.courses.all.useQuery();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  useEffect(() => {
    void activitesStore.fetch();
  }, [activitesStore]);

  const activities = activitesStore.data;

  const router = useRouter();

  const onCreate = useCallback(async () => {
    const { activity, adHocActivity } = await trpc.activity.create.mutate({
      title,
    });
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
    router.push(`/activity/${activity.id}`);
    setTitle("");
    setCreating(false);
  }, [activitesStore, title, router]);

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
              onClick={() => {
                setCreating(true);
              }}
            >
              Create activity
            </Button>
          </SectionHeader>
          <div className="mt-4 flex flex-col gap-2">
            <Modal
              title="Create activity"
              open={creating}
              onCancel={() => setCreating(false)}
              onOk={onCreate}
              okText="Create"
              okButtonProps={{ disabled: title.length === 0 }}
            >
              <Form onFinish={onCreate}>
                <Input
                  placeholder="Activity title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Form>
            </Modal>
            {activities?.map((activity) => {
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
