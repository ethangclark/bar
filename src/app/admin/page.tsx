"use client";
import { api } from "~/trpc/react";
import { ClientOnly } from "../_components/ClientOnly";
import { Page } from "../_components/Page";
import { Title } from "../_components/Title";
import { Button, Spin } from "antd";
import { formatDateTime } from "~/common/utils/timeUtils";
import Link from "next/link";

export default function AdminPage() {
  const { isLoading, data } = api.course.courses.useQuery();
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
            <p>Created: {formatDateTime(course.creationDate)}</p>
            <Link href={`/admin/courses/${course.id}`}>
              <Button type="primary">Edit</Button>
            </Link>
          </div>
        ))}
      </ClientOnly>
    </Page>
  );
}
