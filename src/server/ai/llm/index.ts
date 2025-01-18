import { type DbOrTx } from "~/server/db";
import { type OpenRouterRequest } from "./llmSchemas";
import { getOpenRouterResponse, streamOpenRouterResponse } from "./openRouter";
import { parseResponseText, parseStreamingResponseText } from "./responseText";

export async function getLlmResponse(
  userId: string,
  request: OpenRouterRequest,
  tx: DbOrTx,
) {
  const response = await getOpenRouterResponse(userId, request, tx);
  return parseResponseText(response);
}

export async function* streamLlmResponse(
  userId: string,
  request: OpenRouterRequest,
  tx: DbOrTx,
): AsyncGenerator<string | null> {
  const gen = streamOpenRouterResponse(userId, request, tx);
  let next = await gen.next();
  while (!next.done) {
    const parsed = parseStreamingResponseText(next.value);
    if (parsed instanceof Error) {
      return parsed;
    }
    yield parsed;
    next = await gen.next();
  }
}
