"use client";

import { api } from "~/trpc/react";

export default function Courses() {
  const { data: courses } = api.courses.all.useQuery();
  console.log({ courses });
  return (
    <div>
      <div>Courses</div>
      <div>{courses?.map((c, idx) => <div key={idx}>{c.title}</div>)}</div>
    </div>
  );
}
