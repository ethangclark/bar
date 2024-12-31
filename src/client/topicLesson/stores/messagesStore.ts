import { autorun, makeAutoObservable } from "mobx";
import { trpc } from "~/trpc/proxy";
import { selectedSessionStore } from "./selectedSessionStore";
import { QueryStore } from "~/common/utils/queryStore";
import { Status } from "~/common/utils/status";

const messagesQueryStore = new QueryStore(
  trpc.tutoringSession.chatMessages.query,
);

class MessagesStore {
  constructor() {
    makeAutoObservable(this);
  }
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
    if (!this.streamingAssistantMessage) {
      return base;
    }
    return [
      ...base,
      {
        id: "__streaming",
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
