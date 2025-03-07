import { LoadingPage } from "~/client/components/Loading";
import { Status } from "~/client/utils/status";
import { storeObserver } from "~/client/utils/storeObserver";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { NoScrollPage } from "../components/Page";
import { ActivityDoer } from "./ActivityDoer";
import { ActivityEditor } from "./ActivityEditor";

export const Activity = storeObserver(function Activity({
  focusedActivityStore,
  studentModeStore,
}) {
  const { data } = focusedActivityStore;

  if (data instanceof Status) {
    return <LoadingPage />;
  }

  const { enrolledAs, title } = data;

  const igod = isGraderOrDeveloper(enrolledAs);

  if (igod && !studentModeStore.isStudentMode) {
    return (
      <NoScrollPage>
        <ActivityEditor />
      </NoScrollPage>
    );
  }

  return (
    <NoScrollPage>
      <ActivityDoer assignmentTitle={title} />
    </NoScrollPage>
  );
});
