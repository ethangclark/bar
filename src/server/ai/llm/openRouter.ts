import { env } from "~/env";
import { type DbOrTx } from "~/server/db";
import { assertUsageOk, incrementUsage } from "~/server/services/usageService";
import {
  openRouterResponseSchema,
  streamingOpenRouterResponseSchema,
  type OpenRouterRequest,
  type StreamingOpenRouterResponse,
} from "./types";

export async function getOpenRouterResponse(
  userId: string,
  request: OpenRouterRequest,
  tx: DbOrTx,
) {
  await assertUsageOk(userId, tx);
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );
  const json = await response.json();
  try {
    const result = openRouterResponseSchema.parse(json);
    await incrementUsage(userId, result.usage.total_tokens, tx);
    return result;
  } catch (error) {
    console.error(error);
    console.error("raw json:", json);
    throw new Error("Failed to parse OpenRouter response");
  }
}

export async function* streamOpenRouterResponse(
  userId: string,
  request: OpenRouterRequest,
  tx: DbOrTx,
): AsyncGenerator<StreamingOpenRouterResponse> {
  await assertUsageOk(userId, tx);

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...request, stream: true }),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get reader from response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let totalTokens = 0; // Track total tokens used

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process each complete JSON object in the buffer
    let boundary;
    while ((boundary = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);

      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6);
        if (jsonStr === "[DONE]") {
          // Increment usage with the total tokens before finishing
          if (totalTokens > 0) {
            await incrementUsage(userId, totalTokens, tx);
          }
          return;
        }

        const json = JSON.parse(jsonStr);
        try {
          const result = streamingOpenRouterResponseSchema.parse(json);

          // If this chunk contains usage information, update our total
          if (result.usage) {
            totalTokens = result.usage.total_tokens;
          }

          yield result;
        } catch (error) {
          console.error(error);
          console.error("raw json:", json);
          throw new Error(
            "Failed to parse streaming OpenRouter response (code 1)",
          );
        }
      }
    }
  }

  // Handle any remaining data in the buffer
  if (buffer.trim()) {
    const json = JSON.parse(buffer);
    try {
      const result = streamingOpenRouterResponseSchema.parse(json);

      // Update token count if this final chunk has usage info
      if (result.usage) {
        totalTokens = result.usage.total_tokens;
      }

      yield result;
    } catch (error) {
      console.error(error);
      console.error("raw json:", json);
      throw new Error("Failed to parse streaming OpenRouter response (code 2)");
    }
  }

  // Increment usage with the final total tokens count
  if (totalTokens > 0) {
    await incrementUsage(userId, totalTokens, tx);
  }
}
