import { z } from "zod";

type TextMessage = {
  type: "text";
  content: string;
};
type PngMessage = {
  type: "png";
  content: Buffer;
};
type Message = TextMessage | PngMessage;

export type LlmParams = {
  messages: Message[];
  maxTokens?: number;
  systemPrompt?: string | null;
};

export type LlmResponse = {
  response: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
};

export const PromptsSchema = z.object({
  systemPrompt: z.string(),
  prompt: z.string(),
});
export type Prompts = z.infer<typeof PromptsSchema>;
