"use client";
import { type TreeDataNode } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  type Activity,
  type DetailedCourse,
  type TopicContext,
} from "~/server/db/schema";
import { TitleWithPct } from "./pctDisplay";

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

function useTotalCriteria(course: DetailedCourse | null) {
  return useMemo(() => {
    let total = 0;
    course?.units.forEach((unit) => {
      unit.modules.forEach((module) => {
        module.topics.forEach((topic) => {
          total += topic.understandingCriteria.length;
        });
      });
    });
    return total;
  }, [course?.units]);
}

function getFirstIncompleteTopic(
  course: DetailedCourse,
  satisfiedCriterionIds: Set<string>,
) {
  for (const unit of course.units) {
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
  course,
  activities,
  onSelectTopic,
}: {
  disabled: boolean;
  course: DetailedCourse | null;
  activities: Activity[];
  onSelectTopic: (topicId: string) => void;
}) {
  const satisfiedCriterionIds = useSatisfiedCriterionIds(activities);
  useEffect(() => {
    if (disabled || !course) {
      return;
    }
    const topic = getFirstIncompleteTopic(course, satisfiedCriterionIds);
    if (!topic) {
      return;
    }
    onSelectTopic(topic.id);
  }, [course, disabled, onSelectTopic, satisfiedCriterionIds]);
}

export function useCourseTreeData({
  course,
  activities,
  isLoading,
}: {
  course: DetailedCourse | null;
  activities: Activity[];
  isLoading: boolean;
}) {
  const satisfiedCriterionIds = useSatisfiedCriterionIds(activities);
  const totalCriteria = useTotalCriteria(course);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  useSelectFirstIncompleteTopic({
    disabled: isLoading || selectedTopicId !== null,
    course,
    activities,
    onSelectTopic: setSelectedTopicId,
  });

  const selectedTopicContext = useMemo((): TopicContext | null => {
    if (!selectedTopicId || !course) {
      return null;
    }
    for (const unit of course.units) {
      for (const mod of unit.modules) {
        for (const topic of mod.topics) {
          if (topic.id === selectedTopicId) {
            return {
              topic,
              module: mod,
              unit,
              course,
              courseType: course.courseType,
              understandingCriteria: topic.understandingCriteria,
            };
          }
        }
      }
    }
    return null;
  }, [course, selectedTopicId]);

  const treeData = useMemo((): TreeDataNode[] => {
    if (!course) {
      return [];
    }
    return [
      {
        title: (
          <TitleWithPct
            title={course.courseType.name}
            completed={satisfiedCriterionIds.size}
            total={totalCriteria}
          />
        ),
        key: course.id,
        selectable: false,
        children: course.units.map((unit) => {
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
  }, [course, satisfiedCriterionIds, totalCriteria]);

  return {
    treeData,
    setSelectedTopicId,
    selectedTopicContext,
  };
}
