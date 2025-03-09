import { LoadingPage } from "~/client/components/Loading";
import { Status } from "~/client/utils/status";
import { storeObserver } from "~/client/utils/storeObserver";
import { assertTypesExhausted } from "~/common/assertions";
import { NoScrollPage } from "../components/Page";
import { ActivityDoer } from "./ActivityDoer";
import { ActivityEditor } from "./ActivityEditor";
import { ActivitySubmissions } from "./ActivitySubmissions";

export const Activity = storeObserver(function Activity({
  focusedActivityStore,
  viewModeStore,
}) {
  const { data } = focusedActivityStore;
  const { viewMode } = viewModeStore;

  if (data instanceof Status || viewMode instanceof Status) {
    return <LoadingPage />;
  }

  const { title } = data;

  if (viewMode === "editor") {
    return (
      <NoScrollPage>
        <ActivityEditor />
      </NoScrollPage>
    );
  } else if (viewMode === "doer") {
    return (
      <NoScrollPage>
        <ActivityDoer assignmentTitle={title} />
      </NoScrollPage>
    );
  } else if (viewMode === "submissions") {
    return (
      <NoScrollPage>
        <ActivitySubmissions />
      </NoScrollPage>
    );
  }
  assertTypesExhausted(viewMode);
  return null;
});
