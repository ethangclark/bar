import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { injectItemCompletions } from "./itemCompletionInjector";
import { injectMedia } from "./mediaInjection/mediaInjector";

export async function postProcessAssistantResponse(
  assistantResponse: Message,
  prevMessages: MessageWithDescendents[],
) {
  await Promise.all([
    injectMedia(assistantResponse, prevMessages),
    injectItemCompletions(assistantResponse, prevMessages),
  ]);
}
