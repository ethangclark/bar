import { autorun } from "mobx";
import { trpc } from "~/trpc/proxy";
import { selectedSessionStore } from "./selectedSessionStore";
import { QueryStore } from "~/common/utils/queryStore";

export const messagesStore = new QueryStore(
  trpc.tutoringSession.chatMessages.query,
);

autorun(() => {
  void messagesStore.fetch({
    tutoringSessionId: selectedSessionStore.sessionId,
  });
});
