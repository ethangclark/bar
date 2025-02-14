import { eq } from "drizzle-orm";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { db } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import { type Message } from "~/server/db/schema";
import { injectImages } from "./imageInjector";

export async function postProcessAssistantResponse(
  assistantResponse: Message,
  allMessages: Message[],
) {
  try {
    await injectImages(assistantResponse, allMessages);
  } finally {
    const updates = {
      completed: true,
    };

    await db
      .update(db.x.messages)
      .set(updates)
      .where(eq(db.x.messages.id, assistantResponse.id));
    const descendent = createEmptyDescendents();
    descendent.messages.push({
      ...assistantResponse,
      ...updates,
    });
    await descendentPubSub.publish(descendent);
  }
}
