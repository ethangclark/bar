import { Button, Typography } from "antd";
import { useState } from "react";
import { Assignment } from "~/client/components/Assignment";
import { LoadingPage } from "~/client/components/Loading";
import { LogoutButton } from "~/client/components/LogoutButton";
import { Page } from "~/client/components/Page";
import { assertNever } from "~/common/errorUtils";
import { allIntegrationTypes } from "~/common/types";
import { trpc } from "~/trpc/proxy";
import { api } from "~/trpc/react";
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

export function Overview() {
  const { data: courses, isLoading: isLoadingCourses } =
    api.courses.all.useQuery();
  const { data: activities, isLoading: isLoadingActivities } =
    api.activity.getAll.useQuery();

  const [creating, setCreating] = useState(false);

  if (isLoadingCourses || isLoadingActivities) {
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
                await trpc.activity.create.mutate({ title: "New activity" });
                setCreating(false);
              }}
            >
              Create activity
            </Button>
          </SectionHeader>
          {activities?.map((a) => {
            if (a.type === "adHoc") {
              return (
                <Typography.Link
                  key={a.id}
                  href={`/activity/${a.id}`}
                  className="flex w-full justify-between rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-50"
                >
                  {a.adHocActivity.title}
                </Typography.Link>
              );
            }
            return null;
          })}
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
}
