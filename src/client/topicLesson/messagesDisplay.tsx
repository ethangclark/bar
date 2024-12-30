import { type RefObject } from "react";
import { Spin } from "antd";
import { PreformattedText } from "~/client/components/PreformattedText";
import { type ChatMessage } from "~/server/db/schema";

function Message({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

interface MessagesDisplayProps {
  messages: ChatMessage[] | undefined;
  isLoading: boolean;
  messageWrapperRef: RefObject<HTMLDivElement>;
}

export function MessagesDisplay({
  messages,
  isLoading,
  messageWrapperRef,
}: MessagesDisplayProps) {
  return (
    <div
      className="outline-3 flex h-full w-full items-center overflow-y-auto rounded-3xl p-4 outline outline-gray-200"
      style={{ height: `calc(100vh - 300px)` }}
    >
      <div
        className="flex h-full w-full flex-col overflow-y-auto p-4"
        ref={messageWrapperRef}
      >
        {messages?.map((m, idx) => {
          if (m.senderRole === "system") {
            return null;
          }

          // if subsequent message is system message, and no user messages before it,
          // then this is a "lesson prep" message and should be hidden
          if (
            m.senderRole === "assistant" &&
            messages[idx + 1]?.senderRole === "system" &&
            messages.slice(0, idx).every((x) => x.senderRole !== "user")
          ) {
            return null;
          }

          if (m.senderRole === "user") {
            return (
              <Message key={m.id}>
                <div className="self-end rounded-xl bg-blue-100 p-3">
                  <PreformattedText>{m.content}</PreformattedText>
                </div>
              </Message>
            );
          }

          return (
            <Message key={m.id}>
              <div className="text-sm">
                <PreformattedText>{m.content}</PreformattedText>
              </div>
            </Message>
          );
        })}
        <div className="flex w-full justify-center">
          {isLoading ? (
            <div className="text-gray-500">
              Thinking helpful thoughts... One minute... <Spin />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
