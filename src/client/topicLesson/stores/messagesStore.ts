import { autorun, makeAutoObservable } from "mobx";
import { trpc } from "~/trpc/proxy";
import { selectedSessionStore } from "./selectedSessionStore";
import { QueryStore } from "~/common/utils/queryStore";

const messagesQueryStore = new QueryStore(
  trpc.tutoringSession.chatMessages.query,
);

class MessagesStore {
  constructor() {
    makeAutoObservable(this);
  }
  get messages() {
    return messagesQueryStore.data;
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
