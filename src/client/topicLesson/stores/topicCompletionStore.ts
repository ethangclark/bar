import { makeAutoObservable } from "mobx";
import { type SelectedSessionStore } from "./selectedSessionStore";
import { type SelectedTopicStore } from "./selectedTopicStore";

export class TopicCompletionStore {
  constructor(
    private selectedSessionStore: SelectedSessionStore,
    private selectedTopicStore: SelectedTopicStore,
  ) {
    makeAutoObservable(this);
  }
  completionModalOpen = false;
  noteCompletion() {
    this.completionModalOpen = true;
  }
  async dismissCompletionModalAndStayOnPage() {
    this.completionModalOpen = false;
    await this.selectedSessionStore.startNewSession({
      prevConclusion:
        "The student has demonstrated proficiency. Please continue tutoring them on the topic as they request.",
    });
  }
  dismissCompletionModalGoToNextTopic() {
    this.completionModalOpen = false;
    this.selectedTopicStore.selectNextTopic();
  }
}
