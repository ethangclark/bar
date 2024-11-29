import { pngBufferToUrl } from "~/common/utils/pngUtils";
import { failure, type Result } from "~/common/utils/result";
import { openai } from "./openAiApi";
import { type LlmResponse, type LlmParams } from "../schemas";

export async function getResponseFromOpenAi(
  params: LlmParams,
): Promise<Result<LlmResponse>> {
  const { systemPrompt, messages, maxTokens } = params;
  const completion = await openai.chat.completions.create({
    messages: [
      ...(systemPrompt
        ? [
            {
              role: "system" as const,
              content: systemPrompt,
            },
          ]
        : []),
      {
        role: "user" as const,
        content: messages.map((msg) => {
          switch (msg.type) {
            case "text":
              return { type: "text" as const, text: msg.content };
            case "png":
              return {
                type: "image_url" as const,
                image_url: {
                  url: pngBufferToUrl(msg.content),
                },
              };
          }
        }),
      },
    ],
    model: "gpt-4o-2024-05-13", // better than 2024-08-06
    max_tokens: maxTokens,
  });
  const response = completion.choices[0]?.message.content ?? null;
  if (!response) {
    return failure("No message in completion from OpenAI.");
  }
  const tokensUsed = completion.usage?.total_tokens ?? 0;
  const promptTokens = completion.usage?.prompt_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens ?? 0;
  return { response, tokensUsed, promptTokens, completionTokens };
}
