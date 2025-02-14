import { Status } from "~/client/utils/status";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { scrollbarHeight } from "../utils/scrollbarWidth";
import { storeObserver } from "../utils/storeObserver";
import { ChatInput } from "./ChatInput";
import { Messages } from "./Messages";
import { ThreadSelection } from "./ThreadSelection";

export const ActivityDoer = storeObserver<{ assignmentTitle: string }>(
  function ActivityDoer({ assignmentTitle, activityStore }) {
    const igod =
      activityStore.enrolledAs instanceof Status
        ? false
        : isGraderOrDeveloper(activityStore.enrolledAs);

    return (
      <div
        className="flex h-full w-[350px] flex-col items-center justify-between overflow-y-auto md:w-[672px] lg:w-[894px]"
        style={{
          maxHeight: `calc(100vh - ${scrollbarHeight}px)`,
        }}
      >
        <div className="md:text-md mb-4 flex w-full items-center justify-between">
          <div className="text-lg md:text-2xl">{assignmentTitle}</div>
        </div>
        {igod && <ThreadSelection />}
        <Messages />
        <div
          className="flex w-full justify-center"
          style={{
            position: "relative",
            bottom: 0,
            marginTop: 20,
          }}
        >
          <ChatInput />
        </div>
      </div>
    );
  },
);
