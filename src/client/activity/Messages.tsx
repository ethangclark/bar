import dayjs from "dayjs";
import { useCallback, useEffect, useRef } from "react";
import { Status } from "~/client/utils/status";
import { assertTypesExhausted } from "~/common/assertions";
import { formatRelativeTime } from "~/common/timeUtils";
import { api } from "~/trpc/react";
import { DiagnosticMessage } from "../components/DiagnosticMessage";
import { LoadingCentered } from "../components/Loading";
import { RichText } from "../components/editor/RichText";
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
    // timeout ensures rendering is complete
    setTimeout(() => {
      messageWrapperRef.current?.scrollTo({
        top: messageWrapperRef.current.scrollHeight,
        behavior: "smooth",
      });
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
              return data?.user?.isAdmin && diagnosticsEnabled ? (
                <div
                  key={m.id}
                  id={m.id}
                  className="mb-4 rounded-2xl border border-red-500 bg-gray-100 px-4 py-2"
                >
                  <DiagnosticMessage diagnosticMessage="SYSTEM MESSAGE" />
                  <RichText value={m.content} />
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
                  complete
                >
                  <div className="flex w-full justify-end">
                    <div className="overflow-x-auto rounded-2xl bg-gray-100 px-4 py-2">
                      <RichText value={m.content} />
                    </div>
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
