import { Assignment } from "~/client/components/Assignment";
import { LoadingPage } from "~/client/components/Loading";
import { LogoutButton } from "~/client/components/LogoutButton";
import { Page } from "~/client/components/Page";
import { assertNever } from "~/common/errorUtils";
import { allIntegrationTypes } from "~/common/types";
import { api } from "~/trpc/react";
import { ConnectToCanvas } from "./ConnectToCanvas";

export function Overview() {
  const { data: courses, isLoading: isLoadingCourses } =
    api.courses.all.useQuery();

  if (isLoadingCourses) {
    return <LoadingPage />;
  }

  return (
    <Page>
      <LogoutButton />
      <div className="mb-4 text-4xl">Activities</div>
      <div className="mb-4 text-2xl">Course activities</div>
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
