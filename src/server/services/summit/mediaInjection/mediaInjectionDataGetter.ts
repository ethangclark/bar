// src/server/services/summit/mediaInjectionDataGetter.ts
import { assertTypesExhausted } from "~/common/assertions";
import { getLlmResponse } from "~/server/ai/llm";
import { db } from "~/server/db";
import { Message, MessageWithDescendents } from "~/server/db/schema";
import {
  parseMediaInjectionResponse,
  type MediaInjectionResponse,
} from "./mediaInjectionParser";
import { mediaInjectorPrompt } from "./mediaInjectorPrompt";

async function getMediaInjectionResponse({
  userId,
  assistantMessageContent,
  possibleImageIds,
  possibleVideoIds,
}: {
  userId: string;
  assistantMessageContent: string;
  possibleImageIds: number[];
  possibleVideoIds: number[];
}): Promise<MediaInjectionResponse> {
  const prompt = mediaInjectorPrompt({ assistantMessageContent });

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

  // console.log(`Prompt:\n`, prompt);
  // console.log(`Media injection response:\n`, response);

  const parsed = parseMediaInjectionResponse(
    response,
    possibleImageIds,
    possibleVideoIds,
  );
  if (!parsed.success) {
    console.error(`Prompt that led to response with failed parsing:\n`, prompt);
    console.error(
      `LLM response in getMediaInjectionResponse that could not be parsed:\n`,
      response,
    );
  }

  return parsed;
}

export async function getMediaInjectionData(
  userId: string,
  assistantMessage: Message,
  allMessages: MessageWithDescendents[],
  possibleImageIds: number[],
  possibleVideoIds: number[],
) {
  let response: MediaInjectionResponse | null = null;
  for (let i = 0; i < 3; i++) {
    response = await getMediaInjectionResponse({
      userId,
      assistantMessageContent: assistantMessage.content,
      possibleImageIds,
      possibleVideoIds,
    });
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

  // if all media has been previously injected, return empty array
  const previouslyMentionedImageNumericIds = new Set<number>();
  const previouslyMentionedVideoNumericIds = new Set<number>();
  for (const message of allMessages) {
    for (const viewPiece of message.viewPieces) {
      for (const image of viewPiece.images) {
        previouslyMentionedImageNumericIds.add(image.infoImage.numericId);
      }
      for (const video of viewPiece.videos) {
        previouslyMentionedVideoNumericIds.add(video.infoVideo.numericId);
      }
    }
  }

  // if all media has been previously injected, return empty array
  // (we don't want to re-inject media that has already been injected)
  if (
    response.data.every((d) => {
      switch (d.type) {
        case "image":
          return previouslyMentionedImageNumericIds.has(d.numericId);
        case "video":
          return previouslyMentionedVideoNumericIds.has(d.numericId);
        case "text":
          return true; // text is not a media type
        default:
          assertTypesExhausted(d);
      }
    })
  ) {
    return [];
  }

  return response.data;
}
