import { Button, Spin, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { noop } from "~/common/utils/fnUtils";
import { formatDayDate } from "~/common/utils/timeUtils";
import { type CourseEnrollment, type CourseType } from "~/server/db/schema";
import { api } from "~/trpc/react";

function Option({
  courseType,
  enrollment,
  onEnroll,
  onResume,
}: {
  courseType: CourseType;
  enrollment: CourseEnrollment | null;
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
  const { data: availableCourses, isLoading: areAvailableCoursesLoading } =
    api.course.available.useQuery();
  const { mutateAsync: enroll } = api.course.enroll.useMutation();
  const {
    data: enrollments,
    isLoading: areEnrollmentsLoading,
    refetch: refetchEnrollments,
  } = api.course.enrollments.useQuery();
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
    availableCourses?.latestCourses.forEach((course) => {
      if (
        enrollments?.some(
          (enrollment) =>
            enrollment.course.courseType.id === course.courseTypeId,
        )
      ) {
        return;
      }
      const actionFunc = async () => {
        await enroll({ courseId: course.id });
        await refetchEnrollments();
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
  }, [
    availableCourses?.latestCourses,
    enroll,
    enrollments,
    refetchEnrollments,
    router,
  ]);

  const isLoading = areAvailableCoursesLoading || areEnrollmentsLoading;

  // if there's only one option, just take it
  useEffect(() => {
    if (!isLoading && actionFuncs[0] && actionFuncs.length < 2) {
      void actionFuncs[0]();
    }
  }, [actionFuncs, enrollments, isLoading]);

  if (isLoading) {
    return <Spin />;
  }

  return <div>{options}</div>;
}
