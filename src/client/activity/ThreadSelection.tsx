import { Select } from "antd";
import { z } from "zod";
import { Status } from "~/client/utils/status";
import { formatDateTime } from "~/common/timeUtils";
import { LoadingCentered } from "../components/Loading";
import { storeObserver } from "../utils/storeObserver";

export const ThreadSelection = storeObserver(function ThreadSelection({
  threadStore,
}) {
  const { sortedThreads, selectedThreadId } = threadStore;

  if (sortedThreads instanceof Status) {
    return <LoadingCentered />;
  }

  if (sortedThreads.length < 2) {
    return null;
  }

  return (
    <Select
      className="w-full"
      value={selectedThreadId}
      options={sortedThreads.map((t) => ({
        label: `Chat created on ${formatDateTime(t.createdAt)}`,
        value: t.id,
      }))}
      onChange={(value) => threadStore.selectThread(z.string().parse(value))}
    />
  );
});
