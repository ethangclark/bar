import { useCallback, useRef, type KeyboardEvent } from "react";
import confetti from "canvas-confetti";
import { Editor } from "~/client/components/Editor";
import { VoiceRecorder } from "./voiceRecorder";
import { type AudioData } from "~/common/utils/types";
import { type TutoringSession } from "~/server/db/schema";

interface MessageComposerProps {
  value: string;
  setValue: (val: string) => void;
  isTranscribing: boolean;
  sendingMessage: boolean;
  selectedSession: TutoringSession | null;
  conclusion?: string | null;
  handleAudioData: (audioData: AudioData) => Promise<void>;
  onSend: (content: string) => Promise<{
    masteryDemonstrated: boolean;
    conclusion: string | null;
  }>;
  refetchMessages: () => Promise<unknown>;
  refetchTutoringSessions: () => Promise<TutoringSession[]>;
  onSessionBump: (conclusion: string) => Promise<void>;
  onMastery: () => void;
}

export function MessageComposer({
  value,
  setValue,
  isTranscribing,
  sendingMessage,
  selectedSession,
  conclusion,
  handleAudioData,
  onSend,
  refetchMessages,
  refetchTutoringSessions,
  onSessionBump,
  onMastery,
}: MessageComposerProps) {
  const messageWrapperRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!selectedSession || sendingMessage) return;

        const { masteryDemonstrated, conclusion } = await onSend(value);
        await refetchMessages();
        setValue("");

        if (masteryDemonstrated) {
          await refetchTutoringSessions(); // reload session with updated mastery
          void confetti({
            spread: 100,
            startVelocity: 40,
          });
          onMastery();
        }

        if (!masteryDemonstrated && conclusion) {
          await refetchTutoringSessions(); // reload with conclusion
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
    [
      value,
      sendingMessage,
      selectedSession,
      onSend,
      refetchMessages,
      refetchTutoringSessions,
      setValue,
      onSessionBump,
      onMastery,
    ],
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
          disabled={sendingMessage || conclusion !== null}
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
