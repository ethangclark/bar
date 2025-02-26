// src/server/services/summit/postProcessor.ts
import { type Message } from "~/server/db/schema";
import { injectMedia } from "./mediaInjection/mediaInjector";

export async function postProcessAssistantResponse(
  assistantResponse: Message,
  allMessages: Message[],
) {
  await injectMedia(assistantResponse, allMessages);
}
