import { makeAutoObservable } from "mobx";

class TopicCompletionStore {
  constructor() {
    makeAutoObservable(this);
  }
  completionModalOpen = false;
  noteCompletion() {
    this.completionModalOpen = true;
  }
  dismissCompletionModal() {
    this.completionModalOpen = false;
  }
}

export const topicCompletionStore = new TopicCompletionStore();
