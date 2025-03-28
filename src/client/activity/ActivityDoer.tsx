import { Typography } from "antd";
import { LinkStyle, LinkX } from "../components/Link";
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
  function ActivityDoer({
    assignmentTitle,
    focusedActivityStore,
    threadStore,
  }) {
    const igod =
      focusedActivityStore.igod instanceof Status
        ? false
        : focusedActivityStore.igod;

    return (
      <div
        className="flex h-full w-[350px] flex-col items-center justify-between md:w-[672px] lg:w-[894px]"
        style={{
          maxHeight: `calc(100vh - ${scrollbarHeight}px)`,
        }}
      >
        <div className="flex w-full items-center justify-between gap-1">
          <div>
            <LinkX href="/overview">← Back to overview</LinkX>
          </div>
          {igod && <TeacherOptions />}
          <LogoutButton flushRight />
        </div>
        <div className="md:text-md mb-2 flex w-full items-center justify-between gap-4">
          <div className="text-lg md:text-2xl">{assignmentTitle}</div>
          <div className="grow">
            <Progress />
          </div>
        </div>
        {igod && (
          <div className={`mb-[18px] mt-2 w-full`}>
            <ThreadSelection />
          </div>
        )}
        {threadStore.isOldThread && (
          <div className="mb-5 flex w-full items-center justify-center rounded-lg bg-gray-200 py-2 text-gray-500">
            <Typography.Text>This is an old thread.</Typography.Text>
            <LinkStyle
              className="mx-1"
              onClick={() => threadStore.selectLatestThread()}
            >
              Click here
            </LinkStyle>
            <Typography.Text>to view the current conversation.</Typography.Text>
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
    );
  },
);
