"use client";
import { Spin } from "antd";
import { useMemo } from "react";
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

  const pctDone = useMemo(() => {
    let total = 0;
    enrollment.data?.course.units.forEach((unit) => {
      unit.modules.forEach((module) => {
        total += module.topics.length;
      });
    });
    let completed = 0;
    activites.data?.forEach((activity) => {
      if (activity.topicMasteryProved) {
        completed++;
      }
    });
    return Math.floor((completed / total) * 100);
  }, [activites.data, enrollment.data?.course.units]);

  if (!enrollment.data || !activites.data) {
    return <Spin />;
  }

  return (
    <Page>
      <Title>Course enrollment: {enrollmentId}</Title>
      <ClientOnly>
        <div>Pct done: {pctDone}%</div>
      </ClientOnly>
    </Page>
  );
}
