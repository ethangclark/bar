import { Button } from "antd";
import { Status } from "~/common/utils/status";
import { CenteredLoading } from "../components/Loading";
import { storeObserver } from "../utils/storeObserver";
import { ActivityItem } from "./ActivityItem";

const newItemOptions = [
  {
    type: "info",
    label: "+ Add text/image information",
  },
  {
    type: "question",
    label: "+ Add question",
  },
] as const;

export const ActivityEditor = storeObserver(function ActivityEditor({
  activityEditorStore,
}) {
  const { activity, sortedActivityItemDrafts } = activityEditorStore;

  if (activity instanceof Status) {
    return <CenteredLoading />;
  }

  return (
    <div>
      <div className="text-6xl">{activity.assignment.title}</div>
      {sortedActivityItemDrafts.map((item) => (
        <ActivityItem key={item.id} activityItem={item} />
      ))}
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
