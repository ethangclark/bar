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
    <Card title={courseType.name}>
      <div className="mb-4">
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
      {enrollment && (
        <>
          <Typography.Paragraph className="mb-0">
            Started on {formatDayDate(enrollment.startDate)}
          </Typography.Paragraph>
          <Button type="text" className="px-0 text-gray-500">
            Create new enrollment
          </Button>
        </>
      )}
    </Card>
  );
}

export function Main() {
  const available = api.course.available.useQuery();
  const enroll = api.course.enroll.useMutation();
  const enrollments = api.course.enrollments.useQuery();
  const router = useRouter();

  const options = useMemo(() => {
    const options = Array<React.ReactNode>();
    enrollments.data?.forEach((enrollment) => {
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
          enrollment={null}
          onEnroll={async () => {
            await enroll.mutateAsync({ courseId: course.id });
            await enrollments.refetch();
          }}
          onResume={noop}
        />,
      );
    });
    return options;
  }, [available.data?.latestCourses, enroll, enrollments, router]);

  if (available.isLoading) {
    return <Spin />;
  }

  return (
    <div>
      <Typography.Title level={2}>Courses</Typography.Title>
      {options}
    </div>
  );
}
