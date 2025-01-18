import { env } from "~/env";
import {
  openRouterResponseSchema,
  type OpenRouterRequest,
  streamingOpenRouterResponseSchema,
  type StreamingOpenRouterResponse,
} from "./llmSchemas";
import { assertUsageOk, incrementUsage } from "~/server/services/usage";
import { type DbOrTx } from "~/server/db";

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
  const result = openRouterResponseSchema.parse(json);
  await incrementUsage(userId, result.usage.total_tokens, tx);
  return result;
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
          return;
        }

        const json = JSON.parse(jsonStr);
        const result = streamingOpenRouterResponseSchema.parse(json);
        yield result;
      }
    }
  }

  // Handle any remaining data in the buffer
  if (buffer.trim()) {
    const json = JSON.parse(buffer);
    const result = streamingOpenRouterResponseSchema.parse(json);
    yield result;
  }
}
