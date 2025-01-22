import { Button } from "antd";
import { Status } from "~/common/utils/status";
import { CenteredLoading } from "../components/Loading";
import { storeObserver } from "../utils/storeObserver";
import { ActivityItem } from "./ActivityItem";

const newItemOptions = [
  {
    type: "text",
    label: "+ Add text",
  },
  {
    type: "image",
    label: "+ Add an image",
  },
  {
    type: "question",
    label: "+ Add question",
  },
] as const;

export const ActivityEditor = storeObserver(function ActivityEditor({
  activityEditorStore,
}) {
  const { savedActivity, sortedItemDrafts } = activityEditorStore;

  if (savedActivity instanceof Status || sortedItemDrafts instanceof Status) {
    return <CenteredLoading />;
  }

  return (
    <div>
      <div className="mb-8 text-6xl">{savedActivity.assignment.title}</div>
      <div>
        {sortedItemDrafts.map((draft) => (
          <div key={draft.id} className="mb-8">
            <ActivityItem item={draft} />
          </div>
        ))}
      </div>
      <div>
        {newItemOptions.map((option) => (
          <Button
            key={option.type}
            className="m-1"
            onClick={() => activityEditorStore.addDraftItem(option.type)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
});
