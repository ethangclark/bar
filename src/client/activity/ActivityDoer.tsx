import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { LogoutButton } from "../components/LogoutButton";
import { scrollbarHeight } from "../utils/scrollbarWidth";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";
import { ChatInput } from "./ChatInput";
import { Messages } from "./Messages";
import { Progress } from "./Progress";
import { TeacherOptions } from "./TeacherOptions";
import { ThreadSelection } from "./ThreadSelection";

export const ActivityDoer = storeObserver<{ assignmentTitle: string }>(
  function ActivityDoer({ assignmentTitle, focusedActivityStore }) {
    const igod =
      focusedActivityStore.enrolledAs instanceof Status
        ? false
        : isGraderOrDeveloper(focusedActivityStore.enrolledAs);

    return (
      <div className="flex h-full w-full items-center justify-center gap-8">
        {igod && <TeacherOptions />}
        <div
          className="flex h-full w-[350px] flex-col items-center justify-between md:w-[672px] lg:w-[894px]"
          style={{
            maxHeight: `calc(100vh - ${scrollbarHeight}px)`,
          }}
        >
          <div className="md:text-md flex w-full items-center justify-between">
            <Progress />
            <div className="pl-7 text-lg md:text-2xl">{assignmentTitle}</div>
            <LogoutButton />
          </div>
          {igod && (
            <div className={`mb-[18px] w-full`}>
              <ThreadSelection />
            </div>
          )}
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
      </div>
    );
  },
);
