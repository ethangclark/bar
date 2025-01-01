import { autorun, makeAutoObservable } from "mobx";
import { trpc } from "~/trpc/proxy";
import { selectedSessionStore } from "./selectedSessionStore";
import { QueryStore } from "~/common/utils/queryStore";
import { Status } from "~/common/utils/status";
import { identity } from "@trpc/server/unstable-core-do-not-import";

const messagesQueryStore = new QueryStore(
  trpc.tutoringSession.chatMessages.query,
);

class MessagesStore {
  constructor() {
    makeAutoObservable(this);
  }
  userMessageBeingProcessed = identity<string | null>(null);
  streamingAssistantMessage = "";
  appendToStreamingMessage(message: string) {
    this.streamingAssistantMessage += message;
  }
  get messages() {
    const { data } = messagesQueryStore;
    if (data instanceof Status) {
      return data;
    }
    const base = data.map((m) => ({
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
  async refetch() {
    await messagesQueryStore.fetch({
      tutoringSessionId: selectedSessionStore.sessionId,
    });
  }
}

export const messagesStore = new MessagesStore();

autorun(() => {
  void messagesQueryStore.fetch({
    tutoringSessionId: selectedSessionStore.sessionId,
  });
});
