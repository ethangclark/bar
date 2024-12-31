import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { Status } from "~/common/utils/status";
import { type AudioData } from "~/common/utils/types";
import { type TopicContext } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { MessageComposer } from "./messageComposer";
import { MessagesDisplay } from "./messagesDisplay";
import { SessionBumpModal } from "./sessionBumpModal";
import { SessionSelector } from "./sessionSelector";
import {
  selectedSessionStore,
  useAutoStartSession,
} from "./stores/selectedSessionStore";
import { TopicCompleteModal } from "./topicCompleteModal";
import { TopicHeader } from "./topicHeader";

interface TopicProps {
  enrollmentId: string;
  topicContext: TopicContext;
  topLeftCorner: React.ReactNode;
}

export const TopicLesson = observer(function TopicLesson({
  enrollmentId,
  topicContext,
  topLeftCorner,
}: TopicProps) {
  const { courseType, unit, module, topic } = topicContext;

  useAutoStartSession({ enrollmentId });

  const { isCreatingSession, selectedSession } = selectedSessionStore;

  const { mutateAsync: transcribe, isPending: isTranscribing } =
    api.trascription.transcribe.useMutation();

  const [v, setV] = useState("");

  const handleAudioData = useCallback(
    async (audioData: AudioData) => {
      const perMinute = 160 * 1000; // same logic is in transcriptionRouter.ts
      if (audioData.data.length > perMinute * 10) {
        throw new Error("Audio data exceeds max supported length");
      }
      const { text } = await transcribe(audioData);
      setV((prev) => (prev ? prev + " " + text : text));
    },
    [transcribe],
  );

  const { mutateAsync: sendMessage, isPending: sendingMessage } =
    api.tutoringSession.sendMessage.useMutation();

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [sessionBumpModalOpen, setSessionBumpModalOpen] = useState(false);

  const isLoading = isCreatingSession || sendingMessage;

  const onCancel = useCallback(async () => {
    if (isLoading) {
      return;
    }
    await selectedSessionStore.startNewSession({
      enrollmentId,
      prevConclusion:
        "The student has demonstrated proficiency. Please continue tutoring them on the topic as they request.",
    });
    setCompletionModalOpen(false);
  }, [enrollmentId, isLoading]);

  const onSend = useCallback(
    async (content: string) => {
      if (selectedSession instanceof Status) {
        throw new Error("No session selected");
      }
      return await sendMessage({
        tutoringSessionId: selectedSession.id,
        content,
      });
    },
    [sendMessage, selectedSession],
  );

  const onSessionBump = useCallback(
    async (prevConclusion: string) => {
      setSessionBumpModalOpen(true);
      await selectedSessionStore.startNewSession({
        enrollmentId,
        prevConclusion,
      });
      setSessionBumpModalOpen(false);
    },
    [enrollmentId],
  );

  const onMastery = useCallback(() => {
    setCompletionModalOpen(true);
  }, []);

  return (
    <div className="flex h-full w-[350px] flex-col items-center px-2 md:w-[672px] md:px-8">
      <TopicCompleteModal
        open={completionModalOpen}
        isLoading={isLoading}
        onCancel={onCancel}
      />
      <SessionBumpModal open={sessionBumpModalOpen} />

      <TopicHeader
        courseTypeName={courseType.name}
        unitName={unit.name}
        moduleName={module.name}
        topicName={topic.name}
        topLeftCorner={topLeftCorner}
      />

      <SessionSelector />

      <MessagesDisplay />

      <MessageComposer
        value={v}
        setValue={setV}
        isTranscribing={isTranscribing}
        sendingMessage={sendingMessage}
        handleAudioData={handleAudioData}
        onSend={onSend}
        onSessionBump={onSessionBump}
        onMastery={onMastery}
      />
    </div>
  );
});
