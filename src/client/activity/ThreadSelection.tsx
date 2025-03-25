import { Select } from "antd";
import { useMemo } from "react";
import { z } from "zod";
import { isStatus, Status } from "~/client/utils/status";
import { formatDateTime } from "~/common/timeUtils";
import { LoadingCentered } from "../components/Loading";
import { storeObserver } from "../utils/storeObserver";

export const ThreadSelection = storeObserver(function ThreadSelection({
  threadStore,
  descendentStore,
}) {
  const { organizedThreads, thread, latestThread } = threadStore;

  const messages = descendentStore.get("messages");
  const flags = descendentStore.get("flags");

  const flaggedThreadIds = useMemo((): Set<string> => {
    if (isStatus(messages) || isStatus(flags)) {
      return new Set();
    }
    const messageIdToThreadId: { [key: string]: string } = {};
    for (const message of messages) {
      messageIdToThreadId[message.id] = message.threadId;
    }
    const threadIds = new Set<string>();
    for (const flag of flags) {
      if (flag.unflagged) {
        continue;
      }
      const threadId = messageIdToThreadId[flag.messageId];
      if (threadId) {
        threadIds.add(threadId);
      }
    }
    return threadIds;
  }, [messages, flags]);

  if (
    organizedThreads instanceof Status ||
    thread instanceof Status ||
    latestThread instanceof Status
  ) {
    return <LoadingCentered />;
  }

  if (organizedThreads.length < 2) {
    return null;
  }

  return (
    <Select
      className="w-full"
      value={thread.id}
      options={organizedThreads.map((t) => {
        const hasFlags = flaggedThreadIds.has(t.id);
        const label = `${hasFlags ? "🚩 " : ""}${t.id === latestThread.id ? "(LIVE) " : ""}Chat created on ${formatDateTime(t.createdAt)}`;
        return {
          label,
          value: t.id,
        };
      })}
      onChange={(value) => threadStore.selectThread(z.string().parse(value))}
    />
  );
});
