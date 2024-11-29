import { incrementUsage } from "~/server/services/usage";
import { getResponseFromOpenAi } from "./providers/openAi";
import { type Result, isFailure } from "~/common/utils/result";
import { getResponseFromAnthropic } from "./providers/anthropic";
import { env } from "~/env";
import { type LlmResponse, type LlmParams } from "./schemas";

type Provider = "anthropic" | "openAi";

const defaultProvider: Provider = "openAi";

export async function getResponseFromLlm({
  provider = defaultProvider,
  userId,
  ...params
}: LlmParams & { provider?: Provider; userId: string }): Promise<
  Result<LlmResponse>
> {
  const result = await (() => {
    switch (provider) {
      case "anthropic":
        return getResponseFromAnthropic(params);
      case "openAi":
        return getResponseFromOpenAi(params);
    }
  })();
  if (isFailure(result)) {
    return result;
  }
  if (env.NODE_ENV !== "test") {
    await incrementUsage(userId, result.tokensUsed);
  }
  return result;
}
