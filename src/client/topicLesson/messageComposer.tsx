import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { Editor } from "~/client/components/Editor";
import { noop } from "~/common/utils/fnUtils";
import { Status } from "~/common/utils/status";
import { type AudioData } from "~/common/utils/types";
import { messagesStore } from "./stores/messagesStore";
import { selectedSessionStore } from "./stores/selectedSessionStore";
import { VoiceRecorder } from "./voiceRecorder";
import { observer } from "mobx-react-lite";

interface MessageComposerProps {
  isTranscribing: boolean;
  handleAudioData: (audioData: AudioData) => Promise<void>;
}

export const MessageComposer = observer(function MessageComposer({
  isTranscribing,
  handleAudioData,
}: MessageComposerProps) {
  const { selectedSession } = selectedSessionStore;

  const disabled =
    messagesStore.sendingMessage ||
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
        await messagesStore.sendUserMessage();
      }
    },
    [disabled],
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
          value={messagesStore.userMessage}
          setValue={(v) => messagesStore.setUserMessage(v)}
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
});
