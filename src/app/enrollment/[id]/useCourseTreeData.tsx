"use client";
import { type TreeDataNode } from "antd";
import { useEffect, useMemo, useState } from "react";
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
) {
  for (const unit of course.units) {
    for (const mod of unit.modules) {
      for (const topic of mod.topics) {
        if (!masteredTopicIds.has(topic.id)) {
          return topic;
        }
      }
    }
  }
  return null;
}

function getMasteredTopicIds(tutoringSessions: TutoringSession[]) {
  return new Set(
    tutoringSessions.filter((a) => a.demonstratesMastery).map((a) => a.topicId),
  );
}

function useSelectFirstIncompleteTopic({
  disabled,
  course,
  tutoringSessions,
  onSelectTopic,
}: {
  disabled: boolean;
  course: DetailedCourse | null;
  tutoringSessions: TutoringSession[];
  onSelectTopic: (topicId: string) => void;
}) {
  useEffect(() => {
    if (disabled || !course) {
      return;
    }
    const masteredTopicIds = getMasteredTopicIds(tutoringSessions);
    const topic = getFirstIncompleteTopic(course, masteredTopicIds);
    if (!topic) {
      return;
    }
    onSelectTopic(topic.id);
  }, [tutoringSessions, course, disabled, onSelectTopic]);
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

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  useSelectFirstIncompleteTopic({
    disabled: isLoading || selectedTopicId !== null,
    course,
    tutoringSessions,
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
  };
}
