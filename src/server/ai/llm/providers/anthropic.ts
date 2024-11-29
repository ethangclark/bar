import { errorToFailure, failure, type Result } from "~/common/utils/result";
import { anthropic } from "./anthropicApi";
import { type LlmResponse, type LlmParams } from "../schemas";
import { defaultMaxTokens } from "../constants";

export async function getResponseFromAnthropic(
  params: LlmParams,
): Promise<Result<LlmResponse>> {
  const { messages, maxTokens, systemPrompt } = params;
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens ?? defaultMaxTokens,
      system: systemPrompt ?? undefined,
      messages: [
        {
          role: "user" as const,
          content: messages.map((msg) => {
            switch (msg.type) {
              case "text":
                return { type: "text" as const, text: msg.content };
              case "png":
                return {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: "image/png" as const,
                    data: msg.content.toString("base64"),
                  },
                };
            }
          }),
        },
      ],
    });

    const contentBlock = response.content[0];
    if (!contentBlock) {
      return failure("No content block in completion from Anthropic.");
    }

    if (!("text" in contentBlock)) {
      return failure("No message in completion from Anthropic.");
    }

    const content = contentBlock.text;

    const { input_tokens: promptTokens, output_tokens: completionTokens } =
      response.usage;

    const tokensUsed = promptTokens + completionTokens;

    return {
      response: content,
      tokensUsed,
      promptTokens,
      completionTokens,
    };
  } catch (error) {
    return errorToFailure(error, "Error calling Anthropic API");
  }
}
