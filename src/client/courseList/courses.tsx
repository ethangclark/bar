import { Button, Spin, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { noop } from "~/common/utils/fnUtils";
import { formatDayDate } from "~/common/utils/timeUtils";
import { type Enrollment, type CourseType } from "~/server/db/schema";
import { api } from "~/trpc/react";

function Option({
  courseType,
  enrollment,
  onEnroll,
  onResume,
}: {
  courseType: CourseType;
  enrollment: Enrollment | null;
  onEnroll: () => void;
  onResume: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col items-center rounded-2xl border px-8 py-4">
      <Typography.Title level={3} className="mb-0">
        {courseType.name}
      </Typography.Title>
      {enrollment ? (
        <>
          <Typography.Paragraph className="mb-2">
            Started on {formatDayDate(enrollment.startDate)}
          </Typography.Paragraph>
          <Button
            size="large"
            onClick={onResume}
            type="primary"
            className="px-12"
          >
            Resume
          </Button>
          <Button type="text" className="text-gray-500">
            Begin new course
          </Button>
        </>
      ) : (
        <Button size="large" disabled={!!enrollment} onClick={onEnroll}>
          Enroll
        </Button>
      )}
    </div>
  );
}

export function Courses() {
  const { data, isLoading, refetch } =
    api.courses.availableAndEnrollments.useQuery();
  const { openCourses, enrollments } = data ?? {};
  const { mutateAsync: enroll } = api.courses.enroll.useMutation();
  const router = useRouter();

  const { options, actionFuncs } = useMemo(() => {
    const options = Array<React.ReactNode>();
    const actionFuncs = Array<() => unknown>();
    enrollments?.forEach((enrollment) => {
      const actionFunc = () => router.push(`/enrollment/${enrollment.id}`);
      actionFuncs.push(actionFunc);
      options.push(
        <Option
          key={enrollment.courseId}
          courseType={enrollment.course.courseType}
          enrollment={enrollment}
          onEnroll={noop}
          onResume={actionFunc}
        />,
      );
    });
    openCourses?.forEach((course) => {
      if (
        enrollments?.some(
          (enrollment) =>
            enrollment.course.courseType.id === course.courseType.id,
        )
      ) {
        return;
      }
      const actionFunc = async () => {
        await enroll({ courseId: course.id });
        await refetch();
      };
      actionFuncs.push(actionFunc);
      options.push(
        <Option
          key={course.id}
          courseType={course.courseType}
          enrollment={null}
          onEnroll={actionFunc}
          onResume={noop}
        />,
      );
    });
    return { options, actionFuncs };
  }, [enroll, enrollments, openCourses, refetch, router]);

  // if there's only one option, just take it, and keep showing loading screen
  const isOnlyOneOption = actionFuncs.length === 1;
  useEffect(() => {
    if (!isLoading && isOnlyOneOption) {
      void actionFuncs[0]?.();
    }
  }, [actionFuncs, isLoading, isOnlyOneOption]);
  if (isLoading || isOnlyOneOption) {
    return <Spin />;
  }

  return <div>{options}</div>;
}
