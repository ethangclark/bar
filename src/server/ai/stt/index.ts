import OpenAI from "openai";
import { type AudioDataX } from "~/common/types";
import { env } from "~/env";

type TranscriptionResult = {
  transcript: string;
  metadata: {
    processingTimeMs: number;
  };
};

class TranscriptionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "TranscriptionError";
  }
}

class WhisperTranscriptionService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  private base64ToBuffer(base64String: string): Buffer {
    // Remove the data URL prefix if present
    const base64Data = base64String.replace(/^data:[^,]+,/, "");
    return Buffer.from(base64Data, "base64");
  }

  private async bufferToFile(buffer: Buffer, mimeType: string): Promise<File> {
    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: mimeType });

    // Generate a unique filename
    const filename = `audio-${Date.now()}.webm`;

    // Convert Blob to File
    return new File([blob], filename, { type: mimeType });
  }

  async transcribeAudioBuffer(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      // Convert buffer to file
      const audioFile = await this.bufferToFile(audioBuffer, mimeType);

      // Call Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en", // You can make this configurable
        response_format: "json",
      });

      // Prepare result
      const result: TranscriptionResult = {
        transcript: transcription.text,
        metadata: {
          processingTimeMs: Date.now() - startTime,
        },
      };

      return result;
    } catch (error) {
      if (error instanceof Error) {
        // Handle OpenAI specific errors
        if ("status" in error) {
          throw new TranscriptionError(
            error.message,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            `OPENAI_ERROR_${(error as any).status}`,
          );
        }
        // Handle other errors
        throw new TranscriptionError(error.message, "TRANSCRIPTION_FAILED");
      }
      // Handle unknown errors
      throw new TranscriptionError("Unknown error occurred", "UNKNOWN_ERROR");
    }
  }

  async transcribeAudioData(
    audioDataX: AudioDataX,
  ): Promise<TranscriptionResult> {
    // Validate input
    if (!audioDataX.data) {
      throw new TranscriptionError("No audio data provided", "INVALID_INPUT");
    }

    // Convert base64 to buffer
    const audioBuffer = this.base64ToBuffer(audioDataX.data);

    return this.transcribeAudioBuffer(audioBuffer, audioDataX.mimeType);
  }
}

export async function transcribeAudioBuffer(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<TranscriptionResult> {
  const transcriptionService = new WhisperTranscriptionService(
    env.OPENAI_API_KEY,
  );
  return await transcriptionService.transcribeAudioBuffer(
    audioBuffer,
    mimeType,
  );
}

export async function transcribeAudioData(
  audioDataX: AudioDataX,
): Promise<TranscriptionResult> {
  const transcriptionService = new WhisperTranscriptionService(
    env.OPENAI_API_KEY,
  );
  return await transcriptionService.transcribeAudioData(audioDataX);
}
