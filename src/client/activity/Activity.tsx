import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { Status } from "~/common/status";
import { ActivityEditor } from "./ActivityEditor";

export const Activity = storeObserver(function Activity({ activityStore }) {
  const { activity } = activityStore;

  if (activity instanceof Status) {
    return <LoadingCentered />;
  }

  const igod = isGraderOrDeveloper(activity.course.enrolledAs);

  if (igod) {
    return <ActivityEditor />;
  }

  return <div>TODO :D</div>;
});
