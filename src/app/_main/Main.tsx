import { Spin } from "antd";
import { api } from "~/trpc/react";

export default function Main() {
  const { data, isLoading } = api.course.available.useQuery();

  if (isLoading) {
    return <Spin />;
  }

  return (
    <div>
      {data?.latestCourses.map((course) => (
        <div key={course.courseId}>{course.courseTypeName}</div>
      ))}
    </div>
  );
}
