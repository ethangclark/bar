// src/server/services/summit/imageInjectionDataGetter.ts
import { getLlmResponse } from "~/server/ai/llm";
import { db } from "~/server/db";
import { type Message } from "~/server/db/schema";
import {
  type ImageInjectionResponse,
  parseImageInjectionResponse,
} from "./imageInjectionParser";
import { imageInjectorPrompt } from "./imageInjectorPrompt";

async function getImageInjectionResponse(
  userId: string,
  messages: Message[],
  possibleNumericIds: number[],
): Promise<ImageInjectionResponse> {
  const prompt = imageInjectorPrompt(messages);

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

  const parsed = parseImageInjectionResponse(response, possibleNumericIds);
  if (!parsed.success) {
    console.error(
      `LLM response in getImageInjectionResponse that could not be parsed:`,
      response,
    );
  }

  return parsed;
}

export async function getImageInjectionData(
  userId: string,
  messages: Message[],
  possibleNumericIds: number[],
) {
  let response: ImageInjectionResponse | null = null;
  for (let i = 0; i < 3; i++) {
    response = await getImageInjectionResponse(
      userId,
      messages,
      possibleNumericIds,
    );
    if (response.success) {
      break;
    }
  }
  if (response === null) {
    throw new Error("Failed to get image injection response");
  }
  if (!response.success) {
    throw new Error(
      `Failed to parse image injection response: ${response.reason}`,
    );
  }

  return response.data;
}
