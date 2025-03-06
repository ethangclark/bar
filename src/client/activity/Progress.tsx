import { Progress as AtndProgress } from "antd";
import { sortByOrderFracIdx } from "~/common/indexUtils";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

export const Progress = storeObserver(function Progress({ descendentStore }) {
  const completions = descendentStore.get("completions");
  const itemsRaw = descendentStore.get("items");

  const items = itemsRaw instanceof Status ? [] : sortByOrderFracIdx(itemsRaw);

  const completionCount =
    completions instanceof Status ? 0 : completions.length;

  return (
    <AtndProgress
      type="circle"
      size={50}
      steps={{ count: items.length, gap: 8 }}
      percent={(completionCount / items.length) * 100}
      format={() => (
        <span className="font-bold">
          {completionCount} / {items.length}
        </span>
      )}
      trailColor="rgba(0, 0, 0, 0.10)"
      strokeWidth={15}
    />
  );
});
