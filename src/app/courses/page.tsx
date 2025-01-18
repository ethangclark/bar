"use client";

import { api } from "~/trpc/react";
import { Assignment } from "~/client/components/Assignment";

export default function Courses() {
  const { data: courses } = api.courses.all.useQuery();
  return (
    <div>
      <div className="mb-4 text-6xl">Courses</div>
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
    </div>
  );
}
