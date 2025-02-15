import { type Message } from "~/server/db/schema";
import { injectImages } from "./imageInjector";

export async function postProcessAssistantResponse(
  assistantResponse: Message,
  allMessages: Message[],
) {
  await injectImages(assistantResponse, allMessages);
}
