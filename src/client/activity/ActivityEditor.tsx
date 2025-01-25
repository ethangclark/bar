import { Status } from "~/common/utils/status";
import { LoadingCentered } from "../components/Loading";
import { storeObserver } from "../utils/storeObserver";
import { ActivityItem } from "./ActivityItem";

export const ActivityEditor = storeObserver(function ActivityEditor({
  activityEditorStore,
}) {
  const { savedActivity, sortedItemDrafts } = activityEditorStore;

  if (savedActivity instanceof Status || sortedItemDrafts instanceof Status) {
    return <LoadingCentered />;
  }

  return (
    <div>
      {sortedItemDrafts.map((draft) => (
        <div key={draft.id} className="mb-8">
          <ActivityItem item={draft} />
        </div>
      ))}
    </div>
  );
});
