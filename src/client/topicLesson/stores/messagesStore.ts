import { makeAutoObservable, reaction, runInAction } from "mobx";
import { trpc } from "~/trpc/proxy";
import { QueryStore } from "~/common/utils/queryStore";
import { Status } from "~/common/utils/status";
import { type MessageStreamItem } from "~/common/schemas/messageStreamingSchemas";
import { identity } from "@trpc/server/unstable-core-do-not-import";
import { type FocusedEnrollmentStore } from "./focusedEnrollmentStore";
import confetti from "canvas-confetti";
import { type SessionBumpStore } from "./sessionBumpStore";
import { type SelectedSessionStore } from "./selectedSessionStore";
import { type TopicCompletionStore } from "./topicCompletionStore";

const messagesQueryStore = new QueryStore(
  trpc.tutoringSession.chatMessages.query,
);

export class MessagesStore {
  constructor(
    private focusedEnrollmentStore: FocusedEnrollmentStore,
    private selectedSessionStore: SelectedSessionStore,
    private sessionBumpStore: SessionBumpStore,
    private topicCompletionStore: TopicCompletionStore,
  ) {
    makeAutoObservable(this);
    reaction(
      () => selectedSessionStore.sessionId,
      (sessionId) => {
        if (sessionId === null) {
          messagesQueryStore.reset();
        } else {
          void messagesQueryStore.fetch({
            tutoringSessionId: sessionId,
          });
        }
      },
    );
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
  async sendUserMessage() {
    const { selectedSession } = this.selectedSessionStore;
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
          void messagesQueryStore.refetch().then(async () => {
            console.log("received message", inst.streamingAssistantMessage);
            inst.setStreamingAssistantMessage("");
            if (masteryDemonstrated) {
              await inst.focusedEnrollmentStore.refetchEnrollment(); // reload enrollment data noting new topic completion
              void confetti({
                spread: 100,
                startVelocity: 40,
              });
              inst.topicCompletionStore.noteCompletion();
            }

            if (!masteryDemonstrated && conclusion) {
              inst.sessionBumpStore.openModal();
              await inst.selectedSessionStore.startNewSession({
                prevConclusion: conclusion,
              });
              inst.sessionBumpStore.closeModal();
            }
          });
        },
      },
    );
    return;
  }
}
