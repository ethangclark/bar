import { autorun } from "mobx";
import { createQueryStore } from "~/common/utils/queryStore";
import { trpc } from "~/trpc/proxy";
import { selectedSessionStore } from "./selectedSessionStore";

export const messagesStore = createQueryStore(
  trpc.tutoringSession.chatMessages.query,
);

autorun(() => {
  void messagesStore.fetch({
    tutoringSessionId: selectedSessionStore.sessionId,
  });
});
