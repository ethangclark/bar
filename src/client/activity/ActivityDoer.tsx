import { Status } from "~/client/utils/status";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { LogoutButton } from "../components/LogoutButton";
import { scrollbarHeight } from "../utils/scrollbarWidth";
import { storeObserver } from "../utils/storeObserver";
import { ChatInput } from "./ChatInput";
import { Messages } from "./Messages";
import { ThreadSelection } from "./ThreadSelection";

export const ActivityDoer = storeObserver<{ assignmentTitle: string }>(
  function ActivityDoer({ assignmentTitle, focusedActivityStore }) {
    const igod =
      focusedActivityStore.enrolledAs instanceof Status
        ? false
        : isGraderOrDeveloper(focusedActivityStore.enrolledAs);

    return (
      <div
        className="flex h-full w-[350px] flex-col items-center justify-between md:w-[672px] lg:w-[894px]"
        style={{
          maxHeight: `calc(100vh - ${scrollbarHeight}px)`,
        }}
      >
        {igod && <ThreadSelection />}
        <div className="md:text-md mb-4 flex w-full items-center justify-between">
          <div className="px-2 text-lg md:text-2xl">{assignmentTitle}</div>
          <LogoutButton />
        </div>
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
