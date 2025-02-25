// src/server/services/summit/videoInjectionDataGetter.ts
import { getLlmResponse } from "~/server/ai/llm";
import { db } from "~/server/db";
import { type Message } from "~/server/db/schema";
import {
  type VideoInjectionResponse,
  parseVideoInjectionResponse,
} from "./videoInjectionParser";
import { videoInjectorPrompt } from "./videoInjectorPrompt";

async function getVideoInjectionResponse(
  userId: string,
  messages: Message[],
  possibleNumericIds: number[],
): Promise<VideoInjectionResponse> {
  const prompt = videoInjectorPrompt(messages);

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

  const parsed = parseVideoInjectionResponse(response, possibleNumericIds);
  if (!parsed.success) {
    console.error(
      `LLM response in getVideoInjectionResponse that could not be parsed:`,
      response,
    );
  }

  return parsed;
}

export async function getVideoInjectionData(
  userId: string,
  messages: Message[],
  possibleNumericIds: number[],
) {
  let response: VideoInjectionResponse | null = null;
  for (let i = 0; i < 3; i++) {
    response = await getVideoInjectionResponse(
      userId,
      messages,
      possibleNumericIds,
    );
    if (response.success) {
      break;
    }
  }
  if (response === null) {
    throw new Error("Failed to get video injection response");
  }
  if (!response.success) {
    throw new Error(
      `Failed to parse video injection response: ${response.reason}`,
    );
  }

  return response.data;
}
