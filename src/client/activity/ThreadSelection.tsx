import { Select } from "antd";
import { z } from "zod";
import { Status } from "~/client/utils/status";
import { formatDateTime } from "~/common/timeUtils";
import { LoadingCentered } from "../components/Loading";
import { storeObserver } from "../utils/storeObserver";

export const ThreadSelection = storeObserver(function ThreadSelection({
  threadStore,
}) {
  const { organizedThreads, thread, latestThread } = threadStore;

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
      options={organizedThreads.map((t) => ({
        label: `${t.id === latestThread.id ? "(LIVE) " : ""} Chat created on ${formatDateTime(t.createdAt)}`,
        value: t.id,
      }))}
      onChange={(value) => threadStore.selectThread(z.string().parse(value))}
    />
  );
});
