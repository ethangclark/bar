import { LoadingCentered } from "~/client/components/Loading";
import { storeObserver } from "~/client/utils/storeObserver";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { Status } from "~/common/status";
import { ActivityEditor } from "./ActivityEditor";
import { ActivityDoer } from "./ActivityDoer";
import { NoScrollPage, Page } from "../components/Page";

export const Activity = storeObserver(function Activity({
  activityStore,
  studentModeStore,
}) {
  const { activity } = activityStore;

  if (activity instanceof Status) {
    return <LoadingCentered />;
  }

  const igod = isGraderOrDeveloper(activity.course.enrolledAs);

  if (igod && !studentModeStore.isStudentMode) {
    return (
      <Page>
        <ActivityEditor />
      </Page>
    );
  }

  return (
    <NoScrollPage>
      <ActivityDoer assignmentTitle={activity.assignment.title} />
    </NoScrollPage>
  );
});
