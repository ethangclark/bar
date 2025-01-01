import { makeAutoObservable } from "mobx";
import { selectedSessionStore } from "./selectedSessionStore";
import { selectedTopicStore } from "./selectedTopicStore";

class TopicCompletionStore {
  constructor() {
    makeAutoObservable(this);
  }
  completionModalOpen = false;
  noteCompletion() {
    this.completionModalOpen = true;
  }
  async dismissCompletionModalAndStayOnPage() {
    this.completionModalOpen = false;
    await selectedSessionStore.startNewSession({
      prevConclusion:
        "The student has demonstrated proficiency. Please continue tutoring them on the topic as they request.",
    });
  }
  dismissCompletionModalGoToNextTopic() {
    this.completionModalOpen = false;
    selectedTopicStore.selectNextTopic();
  }
}

export const topicCompletionStore = new TopicCompletionStore();
