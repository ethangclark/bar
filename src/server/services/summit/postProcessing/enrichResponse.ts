import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { injectCompletions } from "../completionInjection/completionInjector";
import { injectFlags } from "../flagInjection/flagInjector";
import { injectMedia } from "../mediaInjection/mediaInjector";

export async function enrichResponse(
  assistantResponse: Message,
  prevMessages: MessageWithDescendents[],
) {
  const [{ completedActivityThisTurn }, { hasViewPieces, mediaInjectionData }] =
    await Promise.all([
      injectCompletions(assistantResponse, prevMessages),
      injectMedia(assistantResponse, prevMessages),
      injectFlags(assistantResponse, prevMessages),
    ]);

  return { hasViewPieces, completedActivityThisTurn, mediaInjectionData };
}
