"use client";
import { Spin } from "antd";
import { z } from "zod";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { Title } from "~/app/_components/Title";
import { api } from "~/trpc/react";

type Props = {
  params: {
    id: string;
  };
};

export default function CoursePage({ params }: Props) {
  const enrollmentId = z.string().parse(params.id);
  const enrollment = api.course.enrollment.useQuery({ enrollmentId });
  const activites = api.activity.enrollmentActivities.useQuery({
    enrollmentId,
  });

  if (!enrollment.data || !activites.data) {
    return <Spin />;
  }

  return (
    <Page>
      <Title>Course enrollment: {enrollmentId}</Title>
      <ClientOnly>
        <div>Yo</div>
      </ClientOnly>
    </Page>
  );
}
