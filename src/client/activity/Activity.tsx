import { LoadingPage } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { Status } from "~/client/utils/status";
import { ActivityEditor } from "./ActivityEditor";
import { ActivityDoer } from "./ActivityDoer";
import { NoScrollPage } from "../components/Page";

export const Activity = storeObserver(function Activity({
  activityStore,
  studentModeStore,
}) {
  const { activity } = activityStore;

  if (activity instanceof Status) {
    return <LoadingPage />;
  }

  const igod = isGraderOrDeveloper(activity.course.enrolledAs);

  if (igod && !studentModeStore.isStudentMode) {
    return (
      <NoScrollPage>
        <ActivityEditor />
      </NoScrollPage>
    );
  }

  return (
    <NoScrollPage>
      <ActivityDoer assignmentTitle={activity.assignment.title} />
    </NoScrollPage>
  );
});
