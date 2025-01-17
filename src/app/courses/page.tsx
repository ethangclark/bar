"use client";

import { api } from "~/trpc/react";

export default function Courses() {
  const { data: courses } = api.courses.all.useQuery();
  console.log({ courses });
  return <div>Courses</div>;
}
