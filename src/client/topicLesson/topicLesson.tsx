import { useCallback } from "react";
import { type AudioData } from "~/common/utils/types";
import { type TopicContext } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { MessageComposer } from "./messageComposer";
import { MessagesDisplay } from "./messagesDisplay";
import { SessionBumpModal } from "./sessionBumpModal";
import { SessionSelector } from "./sessionSelector";
import { TopicCompleteModal } from "./topicCompleteModal";
import { TopicHeader } from "./topicHeader";
import { storeObserver } from "../utils/storeObserver";

interface TopicProps {
  topicContext: TopicContext;
  topLeftCorner: React.ReactNode;
}

export const TopicLesson = storeObserver<TopicProps>(function TopicLesson({
  topicContext,
  topLeftCorner,
  messagesStore,
}) {
  const { courseType, unit, module, topic } = topicContext;

  const { mutateAsync: transcribe, isPending: isTranscribing } =
    api.trascription.transcribe.useMutation();

  const handleAudioData = useCallback(
    async (audioData: AudioData) => {
      const perMinute = 160 * 1000; // same logic is in transcriptionRouter.ts
      if (audioData.data.length > perMinute * 10) {
        throw new Error("Audio data exceeds max supported length");
      }
      const { text } = await transcribe(audioData);
      const prev = messagesStore.userMessage;
      messagesStore.setUserMessage(prev ? prev + " " + text : text);
    },
    [messagesStore, transcribe],
  );

  return (
    <div className="flex h-full w-[350px] flex-col items-center px-2 md:w-[672px] md:px-8">
      <TopicCompleteModal />
      <SessionBumpModal />

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
        isTranscribing={isTranscribing}
        handleAudioData={handleAudioData}
      />
    </div>
  );
});
