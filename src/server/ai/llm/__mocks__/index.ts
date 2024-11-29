import { type Result } from "~/common/utils/result";
import { vi } from "vitest";

export const getResponseFromLlm = vi.fn(
  async (_: {
    prompt: string;
    userId: string;
    quality: "balanced" | "best";
    maxTokens?: number;
    pngBuffers?: Buffer[];
  }): Promise<
    Result<{
      response: string;
      tokensUsed: number;
      promptTokens: number;
      completionTokens: number;
    }>
  > => {
    // Mock implementation
    return {
      response: "Mocked response",
      tokensUsed: 100,
      promptTokens: 50,
      completionTokens: 50,
    };
  },
);
