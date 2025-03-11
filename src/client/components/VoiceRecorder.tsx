import { Button } from "antd";
import { Loader2, Mic, MicOff } from "lucide-react";
import React, { useRef, useState } from "react";
import { type AudioDataX } from "~/common/types";

// Props interface (empty for now but extensible)
interface VoiceRecorderProps {
  onRecordingComplete?: (audioDataX: AudioDataX) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  isProcessing: isProcessingDownstream,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingInternally, setIsProcessingInternally] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async (): Promise<void> => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Determine the appropriate MIME type based on browser support
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: BlobEvent): void => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async (): Promise<void> => {
        setIsProcessingInternally(true);
        try {
          const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });

          // Convert blob to base64 string for SuperJSON serialization
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);

          reader.onloadend = (): void => {
            const base64Audio = reader.result as string;
            const audioDataX: AudioDataX = {
              data: base64Audio,
              mimeType,
            };

            // Call the callback if provided
            onRecordingComplete?.(audioDataX);
            console.log("Prepared audio data:", audioDataX);
            setIsProcessingInternally(false);
          };
        } catch (error) {
          console.error("Error processing audio:", error);
          setIsProcessingInternally(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error(
        "Error accessing microphone:",
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = (): void => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  const isProcessing = isProcessingDownstream ?? isProcessingInternally;

  return (
    <Button
      onClick={toggleRecording}
      disabled={isProcessingInternally || disabled}
      className="flex items-center px-5 py-8 outline-1 outline-gray-200"
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" style={{ color: "red" }} />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
