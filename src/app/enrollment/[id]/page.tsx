"use client";
import { Spin, Tree, type TreeDataNode } from "antd";
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

const toPct = (numerator: number, denominator: number) =>
  Math.floor((numerator / denominator) * 100);
const addPct = (title: string, pct: number) => `${title} - ${pct}%`;

export default function CoursePage({ params }: Props) {
  const enrollmentId = z.string().parse(params.id);
  const enrollment = api.course.enrollment.useQuery({ enrollmentId });
  const activites = api.activity.enrollmentActivities.useQuery({
    enrollmentId,
  });

  const completedTopicIds = useMemo((): Set<string> => {
    if (!activites.data) {
      return new Set();
    }
    return new Set(activites.data.map((a) => a.topicId));
  }, [activites.data]);

  const pctDone = useMemo(() => {
    let total = 0;
    enrollment.data?.course.units.forEach((unit) => {
      unit.modules.forEach((module) => {
        total += module.topics.length;
      });
    });
    return toPct(completedTopicIds.size, total);
  }, [completedTopicIds.size, enrollment.data?.course.units]);

  const treeData = useMemo((): TreeDataNode[] => {
    if (!enrollment.data) {
      return [];
    }
    return [
      {
        title: addPct(enrollment.data.course.courseType.name, pctDone),
        key: enrollment.data.course.id,
        children: enrollment.data.course.units.map((unit) => {
          let done = 0;
          let total = 0;
          unit.modules.forEach((module) => {
            module.topics.forEach((topic) => {
              total++;
              if (completedTopicIds.has(topic.id)) {
                done++;
              }
            });
          });
          return {
            title: addPct(unit.name, toPct(done, total)),
            key: unit.id,
            children: unit.modules.map((module) => ({
              title: addPct(
                module.name,
                toPct(
                  module.topics.filter((t) => completedTopicIds.has(t.id))
                    .length,
                  module.topics.length,
                ),
              ),
              key: module.id,
              children: module.topics.map((topic) => ({
                title: topic.name,
                key: topic.id,
              })),
            })),
          };
        }),
      },
    ];
  }, [completedTopicIds, enrollment.data, pctDone]);

  if (!enrollment.data || !activites.data) {
    return <Spin />;
  }

  return (
    <Page>
      <Title>Course enrollment: {enrollmentId}</Title>
      <ClientOnly>
        <Tree treeData={treeData} />
      </ClientOnly>
    </Page>
  );
}
