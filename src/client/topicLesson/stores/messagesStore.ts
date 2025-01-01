import { autorun, makeAutoObservable, runInAction } from "mobx";
import { trpc } from "~/trpc/proxy";
import { selectedSessionStore } from "./selectedSessionStore";
import { QueryStore } from "~/common/utils/queryStore";
import { Status } from "~/common/utils/status";
import { type MessageStreamItem } from "~/common/schemas/messageStreamingSchemas";
import { identity } from "@trpc/server/unstable-core-do-not-import";
import { focusedEnrollmentStore } from "./focusedEnrollmentStore";
import confetti from "canvas-confetti";
import { topicCompletionStore } from "./topicCompletionStore";
import { sessionBumpStore } from "./sessionBumpStore";

const messagesQueryStore = new QueryStore(
  trpc.tutoringSession.chatMessages.query,
);

class MessagesStore {
  constructor() {
    makeAutoObservable(this);
  }
  userMessage = "";
  setUserMessage(value: string) {
    this.userMessage = value;
  }
  userMessageBeingProcessed = identity<string | null>(null);
  get sendingMessage() {
    return this.userMessageBeingProcessed !== null;
  }
  streamingAssistantMessage = "";
  setStreamingAssistantMessage(value: string) {
    this.streamingAssistantMessage = value;
  }
  get messages() {
    const { swr } = messagesQueryStore;
    if (swr instanceof Status) {
      return swr;
    }
    const base = swr.map((m) => ({
      id: m.id,
      senderRole: m.senderRole,
      content: m.content,
    }));
    if (!this.userMessageBeingProcessed) {
      return base;
    }
    return [
      ...base,
      {
        id: "___userMessageBeingProcessed",
        senderRole: "user",
        content: this.userMessageBeingProcessed,
      },
      {
        id: "___streamingAssistantMessage",
        senderRole: "assistant",
        content: this.streamingAssistantMessage,
      },
    ];
  }
  async fetchLatest() {
    const { sessionId } = selectedSessionStore;
    if (sessionId === null) {
      messagesQueryStore.reset();
    } else {
      void messagesQueryStore.fetch({
        tutoringSessionId: sessionId,
      });
    }
  }
  async sendUserMessage() {
    const { selectedSession } = selectedSessionStore;
    if (selectedSession instanceof Status) return;
    const content = this.userMessage.trim();
    runInAction(() => {
      this.userMessageBeingProcessed = content;
      this.userMessage = "";
    });
    const inst = this;
    const sub = trpc.tutoringSession.streamMessage.subscribe(
      {
        tutoringSessionId: selectedSession.id,
        content,
      },
      {
        onData(data: MessageStreamItem) {
          if (!data.done) {
            inst.setStreamingAssistantMessage(
              inst.streamingAssistantMessage + data.delta,
            );
            return;
          }
          sub.unsubscribe();
          runInAction(() => {
            inst.userMessageBeingProcessed = null;
          });
          const { masteryDemonstrated, conclusion } = data;
          void inst.fetchLatest().then(async () => {
            if (masteryDemonstrated) {
              await focusedEnrollmentStore.refetchEnrollment(); // reload enrollment data noting new topic completion
              void confetti({
                spread: 100,
                startVelocity: 40,
              });
              topicCompletionStore.noteCompletion();
            }

            if (!masteryDemonstrated && conclusion) {
              sessionBumpStore.openModal();
              await selectedSessionStore.startNewSession({
                prevConclusion: conclusion,
              });
              sessionBumpStore.closeModal();
            }
          });
        },
      },
    );
    return;
  }
}

export const messagesStore = new MessagesStore();

autorun(() => {
  void messagesStore.fetchLatest();
});
