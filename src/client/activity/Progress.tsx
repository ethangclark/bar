import { Progress as AtndProgress } from "antd";
import { sortByOrderFracIdx } from "~/common/indexUtils";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

export const Progress = storeObserver(function Progress({
  descendentStore,
  userStore,
}) {
  const completions = descendentStore.get("completions");
  const itemsRaw = descendentStore.get("items");
  const { user } = userStore;

  const items = itemsRaw instanceof Status ? [] : sortByOrderFracIdx(itemsRaw);

  const completionCount =
    completions instanceof Status
      ? 0
      : user instanceof Status
        ? 0
        : completions.filter((c) => c.userId === user.id).length;

  return (
    <AtndProgress
      percent={Math.floor((completionCount / items.length) * 100)}
    />
  );
});
