import { Button, Card, Spin, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
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
    <div className="mb-4 flex items-center rounded-2xl border px-8 py-4">
      <div className="mr-8">
        <Typography.Title level={3} className="mb-0">
          {courseType.name}
        </Typography.Title>
        {enrollment && (
          <>
            <Typography.Paragraph className="mb-0">
              Started on {formatDayDate(enrollment.startDate)}
            </Typography.Paragraph>
            {/* <Button type="text" className="px-0 text-gray-500">
            Create new enrollment
          </Button> */}
          </>
        )}
      </div>
      <div className="">
        {enrollment ? (
          <>
            <Button size="large" onClick={onResume} type="primary">
              Resume
            </Button>
          </>
        ) : (
          <Button size="large" disabled={!!enrollment} onClick={onEnroll}>
            Enroll
          </Button>
        )}
      </div>
    </div>
  );
}

export function Main() {
  const { data: availableCourses, isLoading: areAvailableCoursesLoading } =
    api.course.available.useQuery();
  const { mutateAsync: enroll } = api.course.enroll.useMutation();
  const {
    data: enrollments,
    isLoading: areEnrollmentsLoading,
    refetch: refetchEnrollments,
  } = api.course.enrollments.useQuery();
  const router = useRouter();

  const options = useMemo(() => {
    const options = Array<React.ReactNode>();
    enrollments?.forEach((enrollment) => {
      options.push(
        <Option
          key={enrollment.courseId}
          courseType={enrollment.course.courseType}
          enrollment={enrollment}
          onEnroll={noop}
          onResume={() => router.push(`/enrollment/${enrollment.id}`)}
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
      options.push(
        <Option
          key={course.id}
          courseType={course.courseType}
          enrollment={null}
          onEnroll={async () => {
            await enroll({ courseId: course.id });
            await refetchEnrollments();
          }}
          onResume={noop}
        />,
      );
    });
    return options;
  }, [
    availableCourses?.latestCourses,
    enroll,
    enrollments,
    refetchEnrollments,
    router,
  ]);

  if (areAvailableCoursesLoading || areEnrollmentsLoading) {
    return <Spin />;
  }

  return <div>{options}</div>;
}
