"use client";
import { type TreeDataNode } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type TutoringSession,
  type DetailedCourse,
  type TopicContext,
} from "~/server/db/schema";
import { TitleWithPct } from "./pctDisplay";

function useTotalTopics(course: DetailedCourse | null) {
  return useMemo(() => {
    let total = 0;
    course?.units.forEach((unit) => {
      unit.modules.forEach((module) => {
        total += module.topics.length;
      });
    });
    return total;
  }, [course?.units]);
}

function getFirstIncompleteTopic(
  course: DetailedCourse,
  masteredTopicIds: Set<string>,
  afterTopicId: string | null,
) {
  let found = !afterTopicId;
  for (const unit of course.units) {
    for (const mod of unit.modules) {
      for (const topic of mod.topics) {
        if (topic.id === afterTopicId) {
          found = true;
          continue;
        }
        if (found && !masteredTopicIds.has(topic.id)) {
          return topic;
        }
      }
    }
  }
  if (afterTopicId !== null) {
    return getFirstIncompleteTopic(course, masteredTopicIds, null);
  }
  return null;
}

function getMasteredTopicIds(tutoringSessions: TutoringSession[]) {
  return new Set(
    tutoringSessions.filter((a) => a.demonstratesMastery).map((a) => a.topicId),
  );
}

function useTopicSelection({
  isLoading,
  course,
  tutoringSessions,
}: {
  isLoading: boolean;
  course: DetailedCourse | null;
  tutoringSessions: TutoringSession[];
}) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const gottaWait = isLoading || course === null;

  const selectNextTopic = useCallback(() => {
    if (gottaWait) {
      return;
    }
    const masteredTopicIds = getMasteredTopicIds(tutoringSessions);
    const nextTopic = getFirstIncompleteTopic(
      course,
      masteredTopicIds,
      selectedTopicId,
    );
    setSelectedTopicId(nextTopic?.id ?? null);
  }, [course, gottaWait, selectedTopicId, tutoringSessions]);

  useEffect(() => {
    if (!gottaWait && !selectedTopicId) {
      selectNextTopic();
    }
  }, [gottaWait, selectNextTopic, selectedTopicId]);

  return { selectedTopicId, setSelectedTopicId, selectNextTopic };
}

export function useCourseTreeData({
  course,
  tutoringSessions,
  isLoading,
}: {
  course: DetailedCourse | null;
  tutoringSessions: TutoringSession[];
  isLoading: boolean;
}) {
  const totalTopics = useTotalTopics(course);

  const { selectedTopicId, setSelectedTopicId, selectNextTopic } =
    useTopicSelection({
      isLoading,
      course,
      tutoringSessions,
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
    const masteredTopicIds = getMasteredTopicIds(tutoringSessions);
    return [
      {
        title: (
          <TitleWithPct
            title={course.courseType.name}
            completed={masteredTopicIds.size}
            total={totalTopics}
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
              if (masteredTopicIds.has(topic.id)) {
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
                    module.topics.filter((t) => masteredTopicIds.has(t.id))
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
  }, [tutoringSessions, course, totalTopics]);

  return {
    treeData,
    setSelectedTopicId,
    selectedTopicContext,
    selectNextTopic,
  };
}
