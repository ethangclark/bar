import { useCallback } from "react";
import { type AudioDataX } from "~/common/types";
import { api } from "~/trpc/react";
import { VoiceRecorder } from "../components/VoiceRecorder";

export function VoiceTranscriber({
  onTranscription,
}: {
  onTranscription: (text: string) => void;
}) {
  const { mutateAsync: transcribe, isPending: isTranscribing } =
    api.trascription.transcribe.useMutation();

  const handleAudioDataX = useCallback(
    async (audioDataX: AudioDataX) => {
      const perMinute = 160 * 1000; // same logic is in transcriptionRouter.ts
      if (audioDataX.data.length > perMinute * 10) {
        throw new Error("Audio data exceeds max supported length");
      }

      const { text } = await transcribe(audioDataX);
      onTranscription(text);
    },
    [transcribe, onTranscription],
  );

  return (
    <VoiceRecorder
      onRecordingComplete={handleAudioDataX}
      isProcessing={isTranscribing}
    />
  );
}
