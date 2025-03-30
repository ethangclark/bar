import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { injectCompletions } from "../completionInjection/completionInjector";
import { injectFlags } from "../flagInjection/flagInjector";
import { injectMedia } from "../mediaInjection/mediaInjector";

export async function enrichResponse(
  responseMessage: Message,
  prevMessages: MessageWithDescendents[],
) {
  const [
    { completedActivityThisTurn },
    { hasViewPieces, injections: mediaInjections },
  ] = await Promise.all([
    injectCompletions(responseMessage, prevMessages),
    injectMedia(responseMessage, prevMessages),
    injectFlags(responseMessage, prevMessages),
  ]);

  return { hasViewPieces, completedActivityThisTurn, mediaInjections };
}
