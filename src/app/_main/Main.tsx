import { Button, Spin } from "antd";
import { useMemo } from "react";
import { noop } from "~/common/utils/fnUtils";
import { type CourseType } from "~/server/db/schema";
import { api } from "~/trpc/react";

function Option({
  courseType,
  enrolled,
  onEnroll,
  onResume,
}: {
  courseType: CourseType;
  enrolled: boolean;
  onEnroll: () => void;
  onResume: () => void;
}) {
  return (
    <div>
      <div>{courseType.name}</div>
      <Button disabled={enrolled} onClick={onEnroll}>
        Enroll
      </Button>
      {enrolled ? <Button onClick={onResume}>Resume</Button> : null}
    </div>
  );
}

export default function Main() {
  const available = api.course.available.useQuery();
  const enroll = api.course.enroll.useMutation();
  const enrollments = api.course.enrollments.useQuery();

  const options = useMemo(() => {
    const options = Array<React.ReactNode>();
    enrollments.data?.forEach((enrollment) => {
      options.push(
        <Option
          key={enrollment.courseId}
          courseType={enrollment.course.courseType}
          enrolled
          onEnroll={noop}
          onResume={() => console.log("TODO: resume")}
        />,
      );
    });
    available.data?.latestCourses.forEach((course) => {
      if (
        enrollments.data?.some(
          (enrollment) =>
            enrollment.course.courseType.id === course.courseTypeId,
        )
      ) {
        return;
      }
      options.push(
        <Option
          key={course.id}
          courseType={course.courseType}
          enrolled={false}
          onEnroll={async () => {
            await enroll.mutateAsync({ courseId: course.id });
            await enrollments.refetch();
          }}
          onResume={noop}
        />,
      );
    });
    return options;
  }, [available.data?.latestCourses, enroll, enrollments]);

  if (available.isLoading) {
    return <Spin />;
  }

  return (
    <div>
      <div>Courses</div>
      {options}
    </div>
  );
}
