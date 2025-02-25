import { type Message } from "~/server/db/schema";
import { injectImages } from "./imageInjector";
import { injectVideos } from "./videoInjector";

export async function postProcessAssistantResponse(
  assistantResponse: Message,
  allMessages: Message[],
) {
  await Promise.all([
    injectImages(assistantResponse, allMessages),
    injectVideos(assistantResponse, allMessages),
  ]);
}
