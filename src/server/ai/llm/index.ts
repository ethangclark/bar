import { env } from "~/env";
import { openRouterResponseSchema, type OpenRouterRequest } from "./schemas";

export async function getOpenRouterResponse(request: OpenRouterRequest) {
  const result = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  const json = await result.json();
  return openRouterResponseSchema.parse(json);
}
