import { MessageWithDescendents, type Message } from "~/server/db/schema";
import { injectMedia } from "./mediaInjection/mediaInjector";

export async function postProcessAssistantResponse(
  assistantResponse: Message,
  allMessages: MessageWithDescendents[],
) {
  await injectMedia(assistantResponse, allMessages);
}
