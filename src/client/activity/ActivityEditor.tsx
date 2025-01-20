import { useEffect } from "react";
import { storeObserver } from "../utils/storeObserver";
import { CenteredLoading } from "../components/Loading";
import { Status } from "~/common/utils/status";
import { ActivityItem } from "./ActivityItem";

export const ActivityEditor = storeObserver<{
  activityId: string;
}>(function ActivityEditor({ activityId, activityEditorStore }) {
  useEffect(() => {
    activityEditorStore.loadActivity(activityId);
    return () => activityEditorStore.clearActivity();
  }, [activityEditorStore, activityId]);

  const { activity } = activityEditorStore;

  if (activity instanceof Status) {
    return <CenteredLoading />;
  }

  return (
    <div>
      <div className="text-6xl">{activity.assignment.title}</div>
      {activity.activityItems.map((item) => (
        <ActivityItem key={item.id} activityItem={item} />
      ))}
    </div>
  );
});
