import { Button, Spin } from "antd";
import { api } from "~/trpc/react";

export default function Main() {
  const available = api.course.available.useQuery();
  const enroll = api.course.enroll.useMutation();
  const enrollments = api.course.enrollments.useQuery();

  if (available.isLoading) {
    return <Spin />;
  }

  return (
    <div>
      <div>Available courses</div>
      <div>
        {available.data?.latestCourses.map((course) => (
          <div key={course.courseId}>
            <div>{course.courseTypeName}</div>
            <Button
              disabled={enroll.isPending}
              onClick={async () => {
                await enroll.mutateAsync({ courseId: course.courseId });
                await enrollments.refetch();
              }}
            >
              Begin
            </Button>
          </div>
        ))}
      </div>
      <div>
        <div>Enrollments</div>
        <div>
          {enrollments.data?.map((enrollment) => (
            <div key={enrollment.courseId}>
              <div>{enrollment.courseId}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
