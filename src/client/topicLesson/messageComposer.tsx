import { useCallback, useRef, type KeyboardEvent, useEffect } from "react";
import confetti from "canvas-confetti";
import { Editor } from "~/client/components/Editor";
import { VoiceRecorder } from "./voiceRecorder";
import { type AudioData } from "~/common/utils/types";
import { focusedEnrollmentStore } from "./stores/focusedEnrollmentStore";
import { messagesStore } from "./stores/messagesStore";
import { selectedSessionStore } from "./stores/selectedSessionStore";
import { Status } from "~/common/utils/status";
import { trpc } from "~/trpc/proxy";
import { noop } from "~/common/utils/fnUtils";
import { type MessageStreamItem } from "~/common/schemas/messageStreamingSchemas";

interface MessageComposerProps {
  value: string;
  setValue: (val: string) => void;
  isTranscribing: boolean;
  sendingMessage: boolean;
  handleAudioData: (audioData: AudioData) => Promise<void>;
  onSend: (content: string) => Promise<{
    masteryDemonstrated: boolean;
    conclusion: string | null;
  }>;
  onSessionBump: (conclusion: string) => Promise<void>;
  onMastery: () => void;
}

let sent = false;

export function MessageComposer({
  value,
  setValue,
  isTranscribing,
  sendingMessage,
  handleAudioData,
  onSend,
  onSessionBump,
  onMastery,
}: MessageComposerProps) {
  const messageWrapperRef = useRef<HTMLDivElement>(null);

  const { selectedSession } = selectedSessionStore;

  const disabled =
    sendingMessage ||
    selectedSession instanceof Status ||
    !!selectedSession.conclusion;

  const unsubscribeRef = useRef(noop);
  useEffect(() => {
    unsubscribeRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionStore.selectedSession]);

  const onKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (disabled) return;

        const { selectedSession } = selectedSessionStore;
        if (selectedSession instanceof Status) return;

        if (sent) return;
        sent = true;

        const sub = trpc.tutoringSession.streamMessage.subscribe(
          {
            tutoringSessionId: selectedSession.id,
            content: value,
          },
          {
            onData(data: MessageStreamItem) {
              console.log({ data });
              if (data.done) {
                sub.unsubscribe();
              } else {
                messagesStore.appendToStreamingMessage(data.delta);
              }
            },
          },
        );
        unsubscribeRef.current = () => {
          sub.unsubscribe();
        };
        return;

        const { masteryDemonstrated, conclusion } = await onSend(value);
        await messagesStore.refetch();
        setValue("");

        if (masteryDemonstrated) {
          await focusedEnrollmentStore.refetchEnrollment(); // reload session with updated mastery
          void confetti({
            spread: 100,
            startVelocity: 40,
          });
          onMastery();
        }

        if (!masteryDemonstrated && conclusion) {
          await focusedEnrollmentStore.refetchEnrollment(); // reload with conclusion
          await onSessionBump(conclusion);
        }

        setTimeout(() => {
          // scroll to the bottom
          messageWrapperRef.current?.scrollTo({
            top: messageWrapperRef.current.scrollHeight,
            behavior: "smooth",
          });
        });
      }
    },
    [disabled, value, onSend, setValue, onMastery, onSessionBump],
  );

  return (
    <div
      className="w-[350px] md:w-[562px]"
      style={{
        height: 100,
        position: "relative",
        bottom: 0,
        marginTop: 20,
        marginBottom: -100,
      }}
    >
      <div className="mb-2 flex">
        <Editor
          value={value}
          setValue={setValue}
          placeholder="Compose your message..."
          height={70}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className="mr-4"
        />
        <VoiceRecorder
          onRecordingComplete={handleAudioData}
          isProcessing={isTranscribing}
        />
      </div>
      <div className="w-full text-center text-xs text-gray-400">
        Press enter to send. Response may take a few seconds. Let the tutor know
        if you're done with the topic, or need help. Email questions and issues
        to hello@summited.ai
      </div>
    </div>
  );
}
