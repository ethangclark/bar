"use client";

import { Assignment } from "~/client/components/Assignment";
import { LoadingPage } from "~/client/components/Loading";
import { Page } from "~/client/components/Page";
import { api } from "~/trpc/react";

export default function Courses() {
  const { data: courses, isLoading } = api.courses.all.useQuery();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <Page>
      <div className="mb-4 text-4xl">Courses</div>
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
      </div>
    </Page>
  );
}
