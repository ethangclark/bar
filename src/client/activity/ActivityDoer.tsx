import { Button, Select, Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { assertNever } from "~/common/errorUtils";
import { Status } from "~/common/status";
import { Editor } from "../components/Editor";
import { LoadingPage } from "../components/Loading";
import { VoiceTranscriber } from "../components/VoiceTranscriber";
import { storeObserver } from "../utils/storeObserver";
import { TeacherSection } from "../components/TeacherSection";
import { z } from "zod";
import { formatDateTime } from "~/common/timeUtils";
import { scrollbarHeight } from "../utils/scrollbarWidth";

export function PreformattedText({ children }: { children: React.ReactNode }) {
  return <pre className="text-wrap font-serif">{children}</pre>;
}

function MessageView({
  children,
  className,
  isLastMessage,
  messageContentNotGonnaShowTho,
  scrollToBottom,
}: {
  children: React.ReactNode;
  className?: string;
  isLastMessage: boolean;
  messageContentNotGonnaShowTho: string;
  scrollToBottom: () => void;
}) {
  useEffect(() => {
    if (isLastMessage) {
      scrollToBottom();
    }
  }, [
    isLastMessage,
    scrollToBottom,
    // important to include messageContentNotGonnaShowTho in the dependency array
    // so we re-scroll to the bottom when the message content changes
    messageContentNotGonnaShowTho,
  ]);

  return <div className={`mb-4 flex ${className}`}>{children}</div>;
}

export const ActivityDoer = storeObserver<{ assignmentTitle: string }>(
  function ActivityDoer({
    assignmentTitle,
    threadStore,
    activityStore,
    studentModeStore,
    descendentStore,
  }) {
    const [v, setV] = useState("");

    const messageWrapperRef = useRef<HTMLDivElement>(null);

    const { messages } = threadStore;

    const messageProcessing = false;

    const igod =
      activityStore.enrolledAs instanceof Status
        ? false
        : isGraderOrDeveloper(activityStore.enrolledAs);

    const { sortedThreads, selectedThreadId } = threadStore;

    useEffect(() => {
      threadStore.selectOrCreateThread();
    }, [threadStore]);

    const scrollToBottom = useCallback(() => {
      messageWrapperRef.current?.scrollTo({
        top: messageWrapperRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, []);

    const onTranscription = useCallback((text: string) => {
      setV((v) => (v ? v + " " + text : text));
    }, []);

    if (
      messages instanceof Status ||
      sortedThreads instanceof Status ||
      selectedThreadId instanceof Status
    ) {
      return <LoadingPage />;
    }

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
        {igod && (
          <TeacherSection className="mb-4 flex w-full flex-wrap justify-center gap-2 p-4">
            <Select
              className="grow"
              value={selectedThreadId}
              options={sortedThreads.map((t) => ({
                label: `Chat created on ${formatDateTime(t.createdAt)}`,
                value: t.id,
              }))}
              onChange={(value) =>
                threadStore.selectThread(z.string().parse(value))
              }
            />
            <div className="flex gap-2">
              <Button onClick={() => threadStore.createThread()}>
                New chat
              </Button>
              <Button
                type="primary"
                onClick={() => studentModeStore.setIsStudentMode(false)}
              >
                Back to design
              </Button>
            </div>
          </TeacherSection>
        )}
        <div
          className="outline-3 flex h-full grow items-center overflow-y-auto rounded-3xl p-4 outline outline-gray-200"
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
                      messageContentNotGonnaShowTho={m.content}
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
                      messageContentNotGonnaShowTho={m.content}
                      scrollToBottom={scrollToBottom}
                    >
                      <PreformattedText key={m.id}>
                        {m.content}
                      </PreformattedText>
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
        <div
          className="w-[350px] md:w-[562px]"
          style={{
            position: "relative",
            bottom: 0,
            marginTop: 20,
          }}
        >
          <div className="mb-2 flex">
            <Editor
              value={v}
              setValue={setV}
              placeholder="Compose your message..."
              height={70}
              onKeyDown={async (e) => {
                if (e.key !== "Enter" || e.shiftKey) {
                  return;
                }
                e.preventDefault();
                setV("");
                await descendentStore.create("messages", {
                  content: v,
                  senderRole: "user",
                  threadId: selectedThreadId,
                });
              }}
              disabled={messageProcessing}
              className="mr-4"
            />
            <VoiceTranscriber onTranscription={onTranscription} />
          </div>
          <div className="w-full text-center text-xs text-gray-400">
            Press enter to send. Response may take a few seconds. Let Summit
            know if you want to move on to another part of the activity, or need
            help. Email questions and issues to hello@summited.ai
          </div>
        </div>
      </div>
    );
  },
);
