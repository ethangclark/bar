import { useCallback, useRef } from "react";
import { Status } from "~/client/utils/status";
import { assertNever } from "~/common/errorUtils";
import { LoadingCentered } from "../components/Loading";
import { PreformattedText } from "../components/PreformattedText";
import { storeObserver } from "../utils/storeObserver";
import { MessageView } from "./MessageView";
import { AssistantMessage } from "./AssistantMessage";

export const Messages = storeObserver(function Messages({ threadStore }) {
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
      className="outline-3 flex h-full grow items-center overflow-y-auto rounded-lg outline outline-gray-200"
      style={{ width: `calc(100% - 2px)` }} // to account for the outline
    >
      <div
        className="flex h-full w-full flex-col overflow-y-auto p-6"
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
                <AssistantMessage
                  key={m.id}
                  message={m}
                  isLastMessage={i === messages.length - 1}
                  scrollToBottom={scrollToBottom}
                />
              );
            default:
              assertNever(m.senderRole);
          }
        })}
      </div>
    </div>
  );
});
