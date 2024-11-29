import { type LlmResponse, type LlmParams } from "../schemas";
import { getResponseFromOpenAi } from "../providers/openAi";
import { getResponseFromAnthropic } from "../providers/anthropic";
import { getResponseFromGoogle } from "../providers/google";
import { type Result, isFailure } from "~/common/utils/result";
import { filter } from "~/common/utils/fnUtils";
import { ShouldNeverHappen } from "~/common/utils/errorUtils";

async function getInitialResponses(params: LlmParams) {
  const [openAi, anthropic, google] = await Promise.all(
    [
      getResponseFromOpenAi,
      getResponseFromAnthropic,
      getResponseFromGoogle,
    ].map((fn) => fn(params)),
  );
  if (!openAi || !anthropic || !google) {
    throw new ShouldNeverHappen();
  }
  if (isFailure(openAi) || isFailure(anthropic) || isFailure(google)) {
    const failure = filter([openAi, anthropic, google], isFailure)[0];
    if (!failure) {
      throw new ShouldNeverHappen();
    }
    return failure;
  }

  return { openAi, anthropic, google };
}

export function getSystemPrompt(
  responses: string[],
  baseSystemPrompt: string | null = "",
): string {
  const paddedBase = baseSystemPrompt ? `${baseSystemPrompt}\n\n` : "";
  return `${paddedBase}You have been provided with a set of responses from various industry-leading models to the latest user query. Your task is to synthesize these responses into a single, high-quality response. It is crucial to critically evaluate the information provided in these responses, recognizing that some of it may be biased or incorrect. Your response should not simply replicate the given answers but should offer a refined, accurate, and comprehensive reply to the instruction. Ensure your response is well-structured, coherent, and adheres to the highest standards of accuracy and reliability.

  Responses from models:

${responses
  .map(
    (response, idx) => `// BEGIN RESPONSE ${idx + 1}

${response}

// END RESPONSE ${idx + 1}`,
  )
  .join("\n")}`;
}

export async function getKahunaResponse(
  params: LlmParams & { userId: string },
): Promise<Result<LlmResponse>> {
  const initialResponsesTmp = await getInitialResponses(params);

  // TODO: we want to make this robust if one of these fails due to e.g. account/billing issues
  if (isFailure(initialResponsesTmp)) {
    return initialResponsesTmp;
  }
  const initialResponses = initialResponsesTmp;

  const { openAi, anthropic, google } = initialResponses;
  const responses = [openAi, anthropic, google].map((r) => r.response);

  const { systemPrompt: baseSystemPrompt } = params;
  const systemPrompt = getSystemPrompt(responses, baseSystemPrompt);

  const finalResponseTmp = await getResponseFromAnthropic({
    ...params,
    systemPrompt,
  });
  if (isFailure(finalResponseTmp)) {
    return finalResponseTmp;
  }
  const finalResponse = finalResponseTmp;

  // TODO: assumes we're using google only in the initial responses, and that they do not provide token data
  function aggregateTokens(key: "promptTokens" | "completionTokens") {
    const asArray = Object.values(initialResponses);
    const initialTokens = asArray.reduce((acc, r) => acc + r[key], 0);
    return initialTokens * 1.5 + finalResponse[key];
  }

  const promptTokens = aggregateTokens("promptTokens");
  const completionTokens = aggregateTokens("completionTokens");
  const tokensUsed = promptTokens + completionTokens;

  return {
    response: finalResponse.response,
    tokensUsed,
    promptTokens,
    completionTokens,
  };
}
