"use client";
import { Spin, Tree, type TreeDataNode } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { api } from "~/trpc/react";
import { Topic } from "./topic";
import { type TopicContext } from "~/server/db/schema";

type Props = {
  params: {
    id: string;
  };
};

const maxPct = 100;
const toPct = (numerator: number, denominator: number) =>
  Math.floor((numerator / denominator) * maxPct);
const addPct = (title: string, pct: number) => (
  <>
    {title} - {pct}% {pct === maxPct ? "✅" : ""}
  </>
);

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

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTopicId !== null || !activites.data || !enrollment.data) {
      return;
    }
    const completedTopicIds = activites.data
      .filter((a) => a.topicMasteryProved)
      .map((a) => a.topicId);

    for (const unit of enrollment.data.course.units) {
      for (const mod of unit.modules) {
        for (const topic of mod.topics) {
          if (!completedTopicIds.includes(topic.id)) {
            setSelectedTopicId(topic.id);
            return;
          }
        }
      }
    }
  }, [activites.data, enrollment.data, selectedTopicId]);

  const selectedTopicContext = useMemo((): TopicContext | null => {
    if (!selectedTopicId || !enrollment.data) {
      return null;
    }
    for (const unit of enrollment.data.course.units) {
      for (const mod of unit.modules) {
        for (const topic of mod.topics) {
          if (topic.id === selectedTopicId) {
            return {
              topic,
              module: mod,
              unit,
              course: enrollment.data.course,
              courseType: enrollment.data.course.courseType,
            };
          }
        }
      }
    }
    return null;
  }, [enrollment.data, selectedTopicId]);

  const treeData = useMemo((): TreeDataNode[] => {
    if (!enrollment.data) {
      return [];
    }
    return [
      {
        title: addPct(enrollment.data.course.courseType.name, pctDone),
        key: enrollment.data.course.id,
        selectable: false,
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
            selectable: false,
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
      {/* <Title>{enrollment.data.course.courseType.name}</Title> */}
      <ClientOnly>
        <div className="flex flex-grow flex-wrap justify-start">
          <div style={{ width: 500 }} className="mb-10">
            <Tree
              switcherIcon={<DownOutlined />}
              treeData={treeData}
              onSelect={([rawKey, ...rest]) => {
                if (!rawKey || rest.length > 0) {
                  return;
                }
                const key = z.string().parse(rawKey);
                setSelectedTopicId(key);
              }}
            />
          </div>
          <div className="flex flex-grow justify-center">
            {selectedTopicContext && (
              <Topic topicContext={selectedTopicContext} />
            )}
          </div>
        </div>
      </ClientOnly>
    </Page>
  );
}
