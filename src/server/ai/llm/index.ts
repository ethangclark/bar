import { env } from "~/env";
import { openRouterResponseSchema, type OpenRouterRequest } from "./schemas";
import { assertUsageOk, incrementUsage } from "~/server/services/usage";

export async function getOpenRouterResponse(
  userId: string,
  request: OpenRouterRequest,
) {
  await assertUsageOk(userId);
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
  await incrementUsage(userId, result.usage.total_tokens);
  return result;
}
