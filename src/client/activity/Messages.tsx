import dayjs from "dayjs";
import { useCallback, useEffect, useRef } from "react";
import { Status } from "~/client/utils/status";
import { assertTypesExhausted } from "~/common/assertions";
import { formatRelativeTime } from "~/common/timeUtils";
import { api } from "~/trpc/react";
import { DiagnosticMessage } from "../components/DiagnosticMessage";
import { LoadingCentered } from "../components/Loading";
import { PreformattedText } from "../components/PreformattedText";
import { storeObserver } from "../utils/storeObserver";
import { AssistantMessage } from "./AssistantMessage";
import { MessageView } from "./MessageView";
import { ScrollyContentBox } from "./ScrollyContentBox";

export const Messages = storeObserver(function Messages({
  threadStore,
  userStore,
  diagnosticsStore,
}) {
  const messageWrapperRef = useRef<HTMLDivElement>(null);

  const { messages } = threadStore;

  const scrollToBottom = useCallback(() => {
    messageWrapperRef.current?.scrollTo({
      top: messageWrapperRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const { data } = api.auth.basicSessionDeets.useQuery();
  useEffect(() => {
    if (data) {
      data.user && userStore.setUser(data.user);
    }
  }, [data, userStore]);

  if (messages instanceof Status) {
    return <LoadingCentered />;
  }

  const { diagnosticsEnabled } = diagnosticsStore;

  return (
    <ScrollyContentBox>
      <div
        className="flex h-full w-full flex-col overflow-y-auto p-6"
        ref={messageWrapperRef}
      >
        {messages.map((m, i) => {
          switch (m.senderRole) {
            case "system":
              return data?.isAdmin && diagnosticsEnabled ? (
                <div
                  key={m.id}
                  id={m.id}
                  className="mb-4 rounded-2xl border border-red-500 bg-gray-100 px-4 py-2"
                >
                  <DiagnosticMessage diagnosticMessage="SYSTEM MESSAGE" />
                  <PreformattedText>{m.content}</PreformattedText>
                </div>
              ) : null;
            case "user":
              return (
                <MessageView
                  key={m.id}
                  messageId={m.id}
                  className="ml-[30%] flex flex-col items-end"
                  isLastMessage={i === messages.length - 1}
                  messageLength={m.content.length}
                  scrollToBottom={scrollToBottom}
                  flag={null}
                  diagnosticMessage="USER MESSAGE"
                >
                  <div className="rounded-2xl bg-gray-100 px-4 py-2">
                    <PreformattedText>{m.content}</PreformattedText>
                  </div>
                  {dayjs().diff(dayjs(m.createdAt), "minute") > 10 && (
                    <div className="text-xs text-gray-500">
                      Sent {formatRelativeTime(m.createdAt)}
                    </div>
                  )}
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
              assertTypesExhausted(m.senderRole);
          }
        })}
      </div>
    </ScrollyContentBox>
  );
});
