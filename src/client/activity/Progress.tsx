import { Progress as AtndProgress } from "antd";
import { sortByOrderFracIdx } from "~/common/indexUtils";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

export const Progress = storeObserver(function Progress({
  threadStore,
  descendentStore,
}) {
  const threadId = threadStore.selectedThreadId;
  const completions = descendentStore.get("itemCompletions");
  const itemsRaw = descendentStore.get("items");

  const items = itemsRaw instanceof Status ? [] : sortByOrderFracIdx(itemsRaw);

  const completedItemIds = new Set(
    completions instanceof Status
      ? []
      : completions.filter((c) => c.threadId === threadId).map((c) => c.itemId),
  );

  return (
    <AtndProgress
      type="circle"
      size={50}
      steps={{ count: items.length, gap: 8 }}
      percent={(completedItemIds.size / items.length) * 100}
      format={() => (
        <span className="font-bold">
          {completedItemIds.size + 10} / {items.length + 10}
        </span>
      )}
      trailColor="rgba(0, 0, 0, 0.10)"
      strokeWidth={15}
    />
  );
});
