import { type DbOrTx } from "~/server/db";
import { getOpenRouterResponse, streamOpenRouterResponse } from "./openRouter";
import { parseResponseText, parseStreamingResponseText } from "./responseText";
import { type OpenRouterRequest } from "./types";

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
  onTotalTokens?: (totalTokens: number) => void,
): AsyncGenerator<string | null> {
  const gen = streamOpenRouterResponse(userId, request, tx);
  let next = await gen.next();
  let totalTokens = 0;
  while (!next.done) {
    const tt = next.value.usage?.total_tokens;
    if (tt) {
      totalTokens = tt;
    }
    const parsed = parseStreamingResponseText(next.value);
    if (parsed instanceof Error) {
      return parsed;
    }
    yield parsed;
    next = await gen.next();
  }
  onTotalTokens?.(totalTokens);
}
