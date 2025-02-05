import { Spin } from "antd";
import { useCallback, useRef, useState } from "react";
import { assertNever } from "~/common/errorUtils";
import { Status } from "~/common/status";
import { type AudioDataX } from "~/common/types";
import { api } from "~/trpc/react";
import { Editor } from "../components/Editor";
import { LoadingPage } from "../components/Loading";
import { VoiceRecorder } from "../components/VoiceRecorder";
import { storeObserver } from "../utils/storeObserver";

export function PreformattedText({ children }: { children: React.ReactNode }) {
  return <pre className="text-wrap font-serif">{children}</pre>;
}

function MessageView({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mb-4 flex ${className}`}>{children}</div>;
}

export const ActivityDoer = storeObserver<{ assignmentTitle: string }>(
  function ActivityDoer({ assignmentTitle, threadStore }) {
    const { mutateAsync: transcribe, isPending: isTranscribing } =
      api.trascription.transcribe.useMutation();

    const [v, setV] = useState("");

    const handleAudioDataX = useCallback(
      async (audioDataX: AudioDataX) => {
        const perMinute = 160 * 1000; // same logic is in transcriptionRouter.ts
        if (audioDataX.data.length > perMinute * 10) {
          throw new Error("Audio data exceeds max supported length");
        }

        const { text } = await transcribe(audioDataX);
        setV((v) => (v ? v + " " + text : text));
      },
      [transcribe],
    );

    const messageWrapperRef = useRef<HTMLDivElement>(null);

    const messages = threadStore.messages;

    const messageProcessing = false;

    if (messages instanceof Status) {
      return <LoadingPage />;
    }

    return (
      <div className="flex h-full w-[350px] flex-col items-center justify-between md:w-[672px]">
        <div className="md:text-md mb-2 w-full self-start text-sm">
          <div className="mb-2 text-lg md:text-2xl">{assignmentTitle}</div>
        </div>
        <div className="outline-3 flex h-full w-full grow items-center overflow-y-auto rounded-3xl p-4 outline outline-gray-200">
          <div
            className="flex h-full w-full flex-col overflow-y-auto p-4"
            ref={messageWrapperRef}
          >
            {messages.map((m) => {
              switch (m.senderRole) {
                case "system":
                  return null;
                case "user":
                  return (
                    <MessageView key={m.id} className="justify-end">
                      <div className="rounded-xl bg-blue-100 p-3">
                        <PreformattedText>{m.content}</PreformattedText>
                      </div>
                    </MessageView>
                  );
                case "assistant":
                  return (
                    <MessageView key={m.id}>
                      <div className="text-sm">
                        <PreformattedText key={m.id}>
                          {m.content}
                        </PreformattedText>
                      </div>
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
                console.log("TODO: send message", v);
                setV("");
                setTimeout(() => {
                  // scroll to the bottom
                  messageWrapperRef.current?.scrollTo({
                    top: messageWrapperRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                });
              }}
              disabled={messageProcessing}
              className="mr-4"
            />
            <VoiceRecorder
              onRecordingComplete={handleAudioDataX}
              isProcessing={isTranscribing}
            />
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
