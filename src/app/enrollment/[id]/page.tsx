"use client";
import { Spin, Tree, type TreeDataNode } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { api } from "~/trpc/react";
import { Topic } from "./topic";
import {
  type Activity,
  type TopicContext,
  type DetailedEnrollment,
} from "~/server/db/schema";
import { TitleWithPct } from "./pctDisplay";

type Props = {
  params: {
    id: string;
  };
};

function useSatisfiedCriterionIds(activities: Activity[] = []) {
  return useMemo(
    () =>
      new Set(
        activities
          .filter((a) => a.understandingCriterionSatisfied)
          .map((a) => a.understandingCriterionId),
      ),
    [activities],
  );
}

function useTotalCriteria(enrollment: DetailedEnrollment | null) {
  return useMemo(() => {
    let total = 0;
    enrollment?.course.units.forEach((unit) => {
      unit.modules.forEach((module) => {
        module.topics.forEach((topic) => {
          total += topic.understandingCriteria.length;
        });
      });
    });
    return total;
  }, [enrollment?.course.units]);
}

function getFirstIncompleteTopic(
  enrollment: DetailedEnrollment,
  satisfiedCriterionIds: Set<string>,
) {
  for (const unit of enrollment.course.units) {
    for (const mod of unit.modules) {
      for (const topic of mod.topics) {
        for (const criterion of topic.understandingCriteria) {
          if (!satisfiedCriterionIds.has(criterion.id)) {
            return topic;
          }
        }
      }
    }
  }
  return null;
}

function useSelectFirstIncompleteTopic({
  disabled,
  enrollment,
  activities,
  onSelectTopic,
}: {
  disabled: boolean;
  enrollment: DetailedEnrollment | null;
  activities: Activity[];
  onSelectTopic: (topicId: string) => void;
}) {
  const satisfiedCriterionIds = useSatisfiedCriterionIds(activities);
  useEffect(() => {
    if (disabled || !enrollment) {
      return;
    }
    const topic = getFirstIncompleteTopic(enrollment, satisfiedCriterionIds);
    if (!topic) {
      return;
    }
    onSelectTopic(topic.id);
  }, [disabled, enrollment, onSelectTopic, satisfiedCriterionIds]);
}

export default function CoursePage({ params }: Props) {
  const enrollmentId = z.string().parse(params.id);
  const enrollment = api.course.enrollment.useQuery({ enrollmentId });
  const activities = api.activity.enrollmentActivities.useQuery({
    enrollmentId,
  });

  const satisfiedCriterionIds = useSatisfiedCriterionIds(activities.data);
  const totalCriteria = useTotalCriteria(enrollment.data ?? null);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const isLoading = enrollment.isLoading || activities.isLoading;

  useSelectFirstIncompleteTopic({
    disabled: isLoading || selectedTopicId !== null,
    enrollment: enrollment.data ?? null,
    activities: activities.data ?? [],
    onSelectTopic: setSelectedTopicId,
  });

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
              understandingCriteria: topic.understandingCriteria,
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
        title: (
          <TitleWithPct
            title={enrollment.data.course.courseType.name}
            completed={satisfiedCriterionIds.size}
            total={totalCriteria}
          />
        ),
        key: enrollment.data.course.id,
        selectable: false,
        children: enrollment.data.course.units.map((unit) => {
          let done = 0;
          let total = 0;
          unit.modules.forEach((module) => {
            module.topics.forEach((topic) => {
              total++;
              if (satisfiedCriterionIds.has(topic.id)) {
                done++;
              }
            });
          });
          return {
            title: (
              <TitleWithPct title={unit.name} completed={done} total={total} />
            ),
            key: unit.id,
            selectable: false,
            children: unit.modules.map((module) => ({
              title: (
                <TitleWithPct
                  title={module.name}
                  completed={
                    module.topics.filter((t) => satisfiedCriterionIds.has(t.id))
                      .length
                  }
                  total={module.topics.length}
                />
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
  }, [satisfiedCriterionIds, enrollment.data, totalCriteria]);

  if (!enrollment.data || !activities.data) {
    return <Spin />;
  }

  return (
    <Page>
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
