import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { injectCompletions } from "./completionInjector";
import { injectMedia } from "./mediaInjection/mediaInjector";

export async function postProcessAssistantResponse(
  assistantResponse: Message,
  prevMessages: MessageWithDescendents[],
  { totalTokens }: { totalTokens: number },
) {
  await Promise.all([
    injectMedia(assistantResponse, prevMessages),
    injectCompletions(assistantResponse, prevMessages),
  ]);

  if (totalTokens > 25 /***1000/**/) {
    console.log("GOTTA START A NEW CONVERSATION", totalTokens);
  }
}
