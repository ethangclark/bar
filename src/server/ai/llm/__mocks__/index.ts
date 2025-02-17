import { vi } from "vitest";

export const getResponseFromLlm = vi.fn(
  async (_: {
    prompt: string;
    userId: string;
    quality: "balanced" | "best";
    maxTokens?: number;
    pngBuffers?: Buffer[];
  }): Promise<
    | {
        response: string;
        llmTokensUsed: number;
        promptTokens: number;
        completionTokens: number;
      }
    | Error
  > => {
    // Mock implementation
    return {
      response: "Mocked response",
      llmTokensUsed: 100,
      promptTokens: 50,
      completionTokens: 50,
    };
  },
);
