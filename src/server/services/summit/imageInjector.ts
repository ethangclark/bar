import { Message } from "~/server/db/schema";
import { imageHeaderWithOmissionDisclaimer } from "./summitIntro";
import { imageInjectorPrompt } from "./imageInjectorPrompt";
import { getLlmResponse } from "~/server/ai/llm";
import { db } from "~/server/db";
import {
  ImageInjectionResponse,
  parseImageInjectionResponse,
} from "./imageInjectionParser";

async function getInjectionResponse(
  userId: string,
  messages: Message[],
): Promise<ImageInjectionResponse> {
  const prompt = imageInjectorPrompt(messages);

  const response = await getLlmResponse(
    userId,
    {
      model: "google/gemini-2.0-flash-thinking-exp:free",
      messages: [{ role: "user", content: prompt }],
    },
    db,
  );
  if (response instanceof Error) {
    throw response;
  }

  const parsed = parseImageInjectionResponse(response);
  if (!parsed.success) {
    console.error(
      `LLM response in ${injectImages.name} that could not be parsed:`,
      response,
    );
  }

  return parsed;
}

export async function getInjectionData(userId: string, messages: Message[]) {
  let response: ImageInjectionResponse | null = null;
  for (let i = 0; i < 3; i++) {
    response = await getInjectionResponse(userId, messages);
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

export async function injectImages(messages: Message[]) {
  if (
    !messages.some((m) => m.content.includes(imageHeaderWithOmissionDisclaimer))
  ) {
    return;
  }
  const [message1] = messages;
  if (!message1) {
    throw new Error("No message to inject images into");
  }
  const { userId } = message1;

  const data = await getInjectionData(userId, messages);

  console.log("TODO: leverage injection data", data);
}
