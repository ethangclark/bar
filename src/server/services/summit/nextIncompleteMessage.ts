import { eq } from "drizzle-orm";
import { assertOne } from "~/common/assertions";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";

export async function publishNextIncompleteMessage({
  userId,
  activityId,
  threadId,
}: {
  userId: string;
  activityId: string;
  threadId: string;
}) {
  const [rawMessages, newMessageArr] = await Promise.all([
    db.query.messages.findMany({
      where: eq(schema.messages.threadId, threadId),
    }),
    db
      .insert(schema.messages)
      .values({
        activityId,
        userId,
        threadId,
        senderRole: "assistant" as const,
        content: "",
        status: "incomplete",
      })
      .returning(),
  ]);

  const emptyIncompleteMessage = assertOne(newMessageArr);

  const oldMessages = rawMessages
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .filter((m) => m.id !== emptyIncompleteMessage.id);

  const descendents = {
    ...createEmptyDescendents(),
    messages: [emptyIncompleteMessage],
  };
  await descendentPubSub.publish(descendents);

  return { emptyIncompleteMessage, oldMessages };
}
