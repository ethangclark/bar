"use client";
import { Spin } from "antd";
import { ClientOnly } from "~/client/components/ClientOnly";
import { Page } from "~/client/components/Page";
import { Title } from "~/client/components/Title";
import { formatDateTime } from "~/common/utils/timeUtils";
import { api } from "~/trpc/react";

export default function AdminPage() {
  const { isLoading, data } = api.courses.courses.useQuery();
  if (isLoading) {
    return <Spin />;
  }
  return (
    <Page>
      <Title>Admin</Title>
      <ClientOnly>
        {data?.map((course) => (
          <div key={course.id}>
            <h2>{course.courseType.name}</h2>
            <p>Course ID: {course.id}</p>
            <p>Created: {formatDateTime(course.createdAt)}</p>
            {/* <Link href={`/admin/courses/${course.id}`}>
              <Button type="primary">Edit</Button>
            </Link> */}
          </div>
        ))}
      </ClientOnly>
    </Page>
  );
}
