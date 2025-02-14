import { Spin } from "antd";
import { useCallback, useRef } from "react";
import { Status } from "~/client/utils/status";
import { assertNever } from "~/common/errorUtils";
import { LoadingCentered } from "../components/Loading";
import { PreformattedText } from "../components/PreformattedText";
import { storeObserver } from "../utils/storeObserver";
import { MessageView } from "./MessageView";

export const Messages = storeObserver<{
  messageProcessing: boolean;
}>(function Messages({ messageProcessing, threadStore }) {
  const messageWrapperRef = useRef<HTMLDivElement>(null);

  const { messages } = threadStore;

  const scrollToBottom = useCallback(() => {
    messageWrapperRef.current?.scrollTo({
      top: messageWrapperRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  if (messages instanceof Status) {
    return <LoadingCentered />;
  }

  return (
    <div
      className="outline-3 flex h-full grow items-center overflow-y-auto rounded-2xl p-4 outline outline-gray-200"
      style={{ width: `calc(100% - 2px)` }} // to account for the outline
    >
      <div
        className="flex h-full w-full flex-col overflow-y-auto p-4"
        ref={messageWrapperRef}
      >
        {messages.map((m, i) => {
          switch (m.senderRole) {
            case "system":
              return null;
            case "user":
              return (
                <MessageView
                  key={m.id}
                  className="ml-[30%] justify-end"
                  isLastMessage={i === messages.length - 1}
                  messageLength={m.content.length}
                  scrollToBottom={scrollToBottom}
                >
                  <div className="rounded-2xl bg-gray-100 px-4 py-2">
                    <PreformattedText>{m.content}</PreformattedText>
                  </div>
                </MessageView>
              );
            case "assistant":
              return (
                <MessageView
                  key={m.id}
                  isLastMessage={i === messages.length - 1}
                  messageLength={m.content.length}
                  scrollToBottom={scrollToBottom}
                >
                  <PreformattedText key={m.id}>{m.content}</PreformattedText>
                </MessageView>
              );
            default:
              assertNever(m.senderRole);
          }
        })}
        <div className="flex w-full justify-center">
          {messageProcessing ? (
            <div className="text-gray-500">
              Even AIs need a moment... One minute... <Spin />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});
