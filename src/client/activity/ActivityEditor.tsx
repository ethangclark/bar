import { useEffect } from "react";
import { storeObserver } from "../utils/storeObserver";

export const ActivityEditor = storeObserver<{
  activityId: string;
}>(function ActivityEditor({ activityId, activityEditorStore }) {
  useEffect(() => {
    activityEditorStore.loadActivity(activityId);
  }, [activityEditorStore, activityId]);

  return <div>{activityId}</div>;
});
