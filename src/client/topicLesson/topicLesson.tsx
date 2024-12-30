import { useCallback, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { type TutoringSession, type TopicContext } from "~/server/db/schema";
import { type AudioData } from "~/common/utils/types";
import { useSelectedSession } from "./useSelectedSession";
import { TopicCompleteModal } from "./topicCompleteModal";
import { SessionBumpModal } from "./sessionBumpModal";
import { TopicHeader } from "./topicHeader";
import { SessionSelector } from "./sessionSelector";
import { MessagesDisplay } from "./messagesDisplay";
import { MessageComposer } from "./messageComposer";

interface TopicProps {
  enrollmentId: string;
  topicContext: TopicContext;
  topicTutoringSessions: TutoringSession[];
  refetchTutoringSessions: () => Promise<TutoringSession[]>;
  onTopicComplete: () => void;
  topLeftCorner: React.ReactNode;
}

export function TopicLesson({
  enrollmentId,
  topicContext,
  topicTutoringSessions,
  refetchTutoringSessions,
  onTopicComplete,
  topLeftCorner,
}: TopicProps) {
  const { courseType, unit, module, topic } = topicContext;

  const {
    isCreatingSession,
    selectedSession,
    setSelectedSessionId,
    startNewSession,
  } = useSelectedSession({
    enrollmentId,
    topicContext,
    topicTutoringSessions,
    refetchTutoringSessions,
  });

  const {
    isLoading: areMessagesLoading,
    data: messages,
    refetch: refetchMessages,
  } = api.tutoringSession.chatMessages.useQuery({
    tutoringSessionId: selectedSession?.id ?? null,
  });

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

  const isLoading = isCreatingSession || areMessagesLoading || sendingMessage;
  const messageWrapperRef = useRef<HTMLDivElement>(null);

  const onCancel = useCallback(async () => {
    if (isLoading) {
      return;
    }
    await startNewSession(
      "The student has demonstrated proficiency. Please continue tutoring them on the topic as they request.",
    );
    setCompletionModalOpen(false);
  }, [isLoading, startNewSession]);

  const onSend = useCallback(
    async (content: string) => {
      if (!selectedSession) {
        throw new Error("No selected session");
      }
      return await sendMessage({
        tutoringSessionId: selectedSession.id,
        content,
      });
    },
    [sendMessage, selectedSession],
  );

  const onSessionBump = useCallback(
    async (conclusion: string) => {
      setSessionBumpModalOpen(true);
      await startNewSession(conclusion);
      setSessionBumpModalOpen(false);
    },
    [startNewSession],
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
        onTopicComplete={onTopicComplete}
      />
      <SessionBumpModal open={sessionBumpModalOpen} />

      <TopicHeader
        courseTypeName={courseType.name}
        unitName={unit.name}
        moduleName={module.name}
        topicName={topic.name}
        topLeftCorner={topLeftCorner}
      />

      <SessionSelector
        sessions={topicTutoringSessions}
        selectedSessionId={selectedSession?.id ?? null}
        onSelect={setSelectedSessionId}
      />

      <MessagesDisplay
        messages={messages}
        isLoading={isCreatingSession || areMessagesLoading || sendingMessage}
        messageWrapperRef={messageWrapperRef}
      />

      <MessageComposer
        value={v}
        setValue={setV}
        isTranscribing={isTranscribing}
        sendingMessage={sendingMessage}
        selectedSession={selectedSession}
        conclusion={selectedSession?.conclusion}
        handleAudioData={handleAudioData}
        onSend={onSend}
        refetchMessages={refetchMessages}
        refetchTutoringSessions={refetchTutoringSessions}
        onSessionBump={onSessionBump}
        onMastery={onMastery}
      />
    </div>
  );
}
