import { type MaybePromise } from "~/common/types";
import { LoadingCentered } from "../components/Loading";
import { isStatus } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";
import { CreateActivityButton } from "./CreateActivityButton";

export const NoActivites = storeObserver<{
  onCreate: (title: string) => MaybePromise<void>;
}>(function NoActivites({ userStore, onCreate }) {
  const { user } = userStore;

  if (isStatus(user)) {
    return <LoadingCentered />;
  }

  if (user.isInstructor) {
    return (
      <div className="flex grow flex-col items-center justify-center gap-4">
        <div
          className="text-center text-sm text-gray-500"
          style={{ width: 300 }}
        >
          Click to create a standalone activity :)
        </div>
        <CreateActivityButton onCreate={onCreate} />
        <div className="text-center text-sm text-gray-500">
          {/* When changing this, need to update the flow for non-instructors to point them towards connecting their LMS */}
          Coming soon: LMS connections
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex grow flex-col items-center justify-center gap-4">
        <div className="text-center text-xl">
          You haven't started any activities yet!
        </div>
        <div className="text-center text-sm">
          To begin an activity, use the activity link provided by your
          instructor.
        </div>
      </div>
    );
  }
});
