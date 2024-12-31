import { autorun, makeAutoObservable } from "mobx";
import { identity } from "~/common/utils/types";
import { type DetailedCourse, type TopicContext } from "~/server/db/schema";
import { focusedEnrollmentStore } from "./focusedEnrollmentStore";
import { TitleWithPct } from "../pctDisplay";
import { DownOutlined } from "@ant-design/icons";
import { z } from "zod";
import { sortSessionsEarliestFirst } from "../utils";
import { LoadStatus } from "~/common/utils/loading";

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

class SelectedTopicStore {
  constructor() {
    makeAutoObservable(this);
  }
  selectedTopicId = identity<string | null>(null);
  get isTopicSelected() {
    return this.selectedTopicId !== null;
  }
  selectTopic(topicId: string | null) {
    this.selectedTopicId = topicId;
  }
  selectNextTopic() {
    const { course, masteredTopicIds } = focusedEnrollmentStore;
    if (
      course instanceof LoadStatus ||
      masteredTopicIds instanceof LoadStatus
    ) {
      return;
    }
    const nextTopic = getFirstIncompleteTopic(
      course,
      masteredTopicIds,
      this.selectedTopicId,
    );
    this.selectTopic(nextTopic?.id ?? null);
  }
  get selectedTopicContext(): TopicContext | null {
    const { course } = focusedEnrollmentStore;
    if (!this.selectedTopicId || course instanceof LoadStatus) {
      return null;
    }
    for (const unit of course.units) {
      for (const mod of unit.modules) {
        for (const topic of mod.topics) {
          if (topic.id === this.selectedTopicId) {
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
  }
  get topicTutoringSessions() {
    const { tutoringSessions } = focusedEnrollmentStore;
    const { selectedTopicContext } = this;
    if (tutoringSessions instanceof LoadStatus) {
      return tutoringSessions;
    }
    return (tutoringSessions ?? []).filter(
      (s) => s.topicId === selectedTopicContext?.topic.id,
    );
  }
  get topicSessionsEarliestFirst() {
    if (this.topicTutoringSessions instanceof LoadStatus) {
      return this.topicTutoringSessions;
    }
    return sortSessionsEarliestFirst(this.topicTutoringSessions);
  }
  get treeData() {
    const { course, masteredTopicIds, totalTopics } = focusedEnrollmentStore;
    if (
      course instanceof LoadStatus ||
      masteredTopicIds instanceof LoadStatus
    ) {
      return [];
    }
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
                title: `${topic.name} ${masteredTopicIds.has(topic.id) ? "✅" : ""}`,
                key: topic.id,
              })),
            })),
          };
        }),
      },
    ];
  }
  get treeProps() {
    const { course } = focusedEnrollmentStore;
    return {
      switcherIcon: <DownOutlined />,
      treeData: this.treeData,
      selectedKeys: this.selectedTopicId ? [this.selectedTopicId] : [],
      onSelect: ([rawKey, ...rest]: React.Key[]) => {
        if (!rawKey || rest.length > 0) {
          return;
        }
        const key = z.string().parse(rawKey);
        this.selectTopic(key);
      },
      defaultExpandedKeys: course instanceof LoadStatus ? [] : [course.id], // we want the root course node expanded
    };
  }
}

export const selectedTopicStore = new SelectedTopicStore();

autorun(() => {
  const { enrollment } = focusedEnrollmentStore;
  if (
    !(enrollment instanceof LoadStatus) &&
    !selectedTopicStore.isTopicSelected
  ) {
    selectedTopicStore.selectNextTopic();
  }
});
