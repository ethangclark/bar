import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { Status } from "~/common/status";
import { ActivityEditor } from "./ActivityEditor";
import { ActivityDoer } from "./ActivityDoer";

export const Activity = storeObserver(function Activity({ activityStore }) {
  const { activity } = activityStore;

  if (activity instanceof Status) {
    return <LoadingCentered />;
  }

  const igod = isGraderOrDeveloper(activity.course.enrolledAs);

  if (igod && false) {
    return <ActivityEditor />;
  }

  return <ActivityDoer assignmentTitle={activity.assignment.title} />;
});
