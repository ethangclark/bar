import { db } from "~/server/db";
import { messagePubSub } from "~/server/db/pubsub/messagePubSub";
import { type Thread } from "~/server/db/schema";

export async function generateIntroMessages(threads: Thread[]) {
  const messages = await db
    .insert(db.x.messages)
    .values(
      threads.flatMap((thread) => [
        {
          threadId: thread.id,
          userId: thread.userId,
          content:
            "Yarg, this be the system prompt. Be speaking like a pirate in this interaction, matey.",
          senderRole: "system" as const,
          activityId: thread.activityId,
        },
        {
          threadId: thread.id,
          userId: thread.userId,
          content: "Ahoy, matey! Let's be doing this lesson pirate-style.",
          senderRole: "assistant" as const,
          activityId: thread.activityId,
        },
      ]),
    )
    .returning();
  await messagePubSub.publish(messages);
}
