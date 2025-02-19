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
  <div className="mb-4 text-2xl">{title}</div>
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
      <LogoutButton />
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
      {activities?.map((a) => {
        if (a.type === "adHoc") {
          return (
            <div key={a.id}>
              <Typography.Link href={`/activity/${a.id}`}>
                {a.adHocActivity.title}
              </Typography.Link>
            </div>
          );
        }
        return null;
      })}
      <SectionTitle title="Course activities" />
      <div>
        To create activities for course assignments, connect to your LMS.
      </div>
      <div>
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
        {courses?.length === 0 &&
          allIntegrationTypes.map((it) => {
            switch (it) {
              case "canvas":
                return <ConnectToCanvas />;
              default:
                assertNever(it);
            }
          })}
      </div>
    </Page>
  );
}
