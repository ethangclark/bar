import { failure, type Result } from "~/common/utils/result";
import { groq } from "./groqApi";
import { type LlmResponse } from "../schemas";

export async function getResponseFromGroq(
  prompt: string,
  maxTokens: number,
): Promise<Result<LlmResponse>> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "llama3-70b-8192",
      max_tokens: maxTokens,
    });
    const response = completion.choices[0]?.message.content ?? null;
    if (!response) {
      return failure("No message in completion from Groq.");
    }
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    return { response, tokensUsed, promptTokens, completionTokens };
  } catch (_) {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "llama-3.1-70b-versatile",
      max_tokens: maxTokens,
    });
    const response = completion.choices[0]?.message.content ?? null;
    if (!response) {
      return failure("No message in completion from Groq.");
    }
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    return { response, tokensUsed, promptTokens, completionTokens };
  }
}
