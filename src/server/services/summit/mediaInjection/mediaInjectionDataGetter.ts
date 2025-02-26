// src/server/services/summit/mediaInjectionDataGetter.ts
import { getLlmResponse } from "~/server/ai/llm";
import { db } from "~/server/db";
import {
  type MediaInjectionResponse,
  parseMediaInjectionResponse,
} from "./mediaInjectionParser";
import { mediaInjectorPrompt } from "./mediaInjectorPrompt";

async function getMediaInjectionResponse(
  userId: string,
  lastAssistantMessage: string,
  possibleImageIds: number[],
  possibleVideoIds: number[],
): Promise<MediaInjectionResponse> {
  const prompt = mediaInjectorPrompt({ lastAssistantMessage });

  const response = await getLlmResponse(
    userId,
    {
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
    },
    db,
  );
  if (response instanceof Error) {
    throw response;
  }

  const parsed = parseMediaInjectionResponse(
    response,
    possibleImageIds,
    possibleVideoIds,
  );
  if (!parsed.success) {
    console.error(
      `LLM response in getMediaInjectionResponse that could not be parsed:`,
      response,
    );
  }

  return parsed;
}

export async function getMediaInjectionData(
  userId: string,
  lastAssistantMessage: string,
  possibleImageIds: number[],
  possibleVideoIds: number[],
) {
  let response: MediaInjectionResponse | null = null;
  for (let i = 0; i < 3; i++) {
    response = await getMediaInjectionResponse(
      userId,
      lastAssistantMessage,
      possibleImageIds,
      possibleVideoIds,
    );
    if (response.success) {
      break;
    }
  }
  if (response === null) {
    throw new Error("Failed to get media injection response");
  }
  if (!response.success) {
    throw new Error(
      `Failed to parse media injection response: ${response.reason}`,
    );
  }

  return response.data;
}
