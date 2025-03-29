import { eq } from "drizzle-orm";
import { assertOne } from "~/common/assertions";
import { db, schema } from "~/server/db";
import { publishDescendentUpserts } from "~/server/db/pubsub/descendentPubSub";

export async function publishNewIncompleteMessage({
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

  await publishDescendentUpserts({
    messages: [emptyIncompleteMessage],
  });

  return { emptyIncompleteMessage, oldMessages };
}
