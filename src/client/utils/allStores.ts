import { FocusedEnrollmentStore } from "../topicLesson/stores/focusedEnrollmentStore";
import { MessagesStore } from "../topicLesson/stores/messagesStore";
import { SelectedSessionStore } from "../topicLesson/stores/selectedSessionStore";
import { SelectedTopicStore } from "../topicLesson/stores/selectedTopicStore";
import { SessionBumpStore } from "../topicLesson/stores/sessionBumpStore";
import { TopicCompletionStore } from "../topicLesson/stores/topicCompletionStore";

const focusedEnrollmentStore = new FocusedEnrollmentStore();
const selectedTopicStore = new SelectedTopicStore(focusedEnrollmentStore);
const selectedSessionStore = new SelectedSessionStore(
  focusedEnrollmentStore,
  selectedTopicStore,
);
const sessionBumpStore = new SessionBumpStore();
const topicCompletionStore = new TopicCompletionStore(
  selectedSessionStore,
  selectedTopicStore,
);
const messagesStore = new MessagesStore(
  focusedEnrollmentStore,
  selectedSessionStore,
  sessionBumpStore,
  topicCompletionStore,
);

export const stores = {
  focusedEnrollmentStore,
  messagesStore,
  selectedSessionStore,
  selectedTopicStore,
  sessionBumpStore,
  topicCompletionStore,
};
export type Stores = typeof stores;
