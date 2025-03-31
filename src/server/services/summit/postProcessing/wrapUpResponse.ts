import { eq } from "drizzle-orm";
import { assertOne } from "~/common/assertions";
import { db, schema, type DbOrTx } from "~/server/db";
import { publishDescendentUpserts } from "~/server/db/pubsub/descendentPubSub";
import { threadWrapPubSub } from "~/server/db/pubsub/threadWrapPubSub";
import { type Message } from "~/server/db/schema";
import { insertIntroMessages } from "../summitIntro";

async function wrapThreadOnTokenLimit({
  userId,
  activityId,
  threadTokenLength,
}: {
  userId: string;
  activityId: string;
  threadTokenLength: number;
}) {
  if (threadTokenLength > 25000) {
    const threads = await db
      .insert(schema.threads)
      .values({ activityId, userId })
      .returning();
    const thread = assertOne(threads);
    const messages = await insertIntroMessages(thread);
    await publishDescendentUpserts({
      threads,
      messages,
    });

    await threadWrapPubSub.publish({
      threadId: thread.id,
      userId,
      activityId,
      reason: "token-limit",
    });
  }
}

async function updateAndPublishCompletion(
  assistantResponse: Message,
  { hasViewPieces }: { hasViewPieces: boolean },
  tx: DbOrTx,
) {
  const updates = {
    status: hasViewPieces
      ? ("completeWithViewPieces" as const)
      : ("completeWithoutViewPieces" as const),
    hasViewPieces,
  };

  const updatedMessage = {
    ...assistantResponse,
    ...updates,
  };

  await Promise.all([
    tx
      .update(schema.messages)
      .set(updates)
      .where(eq(schema.messages.id, assistantResponse.id)),
    publishDescendentUpserts({
      messages: [updatedMessage],
    }),
  ]);
}

export async function wrapUpResponse({
  assistantResponse,
  hasViewPieces,
  completedActivityThisTurn,
  threadTokenLength,
  tx,
}: {
  assistantResponse: Message;
  hasViewPieces: boolean;
  completedActivityThisTurn: boolean;
  threadTokenLength: number;
  tx: DbOrTx;
}) {
  const { threadId, userId, activityId } = assistantResponse;
  if (completedActivityThisTurn) {
    await threadWrapPubSub.publish({
      threadId,
      userId,
      activityId,
      reason: "activity-completed",
    });
  } else {
    await wrapThreadOnTokenLimit({ userId, activityId, threadTokenLength });
  }

  await updateAndPublishCompletion(
    assistantResponse,
    {
      hasViewPieces,
    },
    tx,
  );
}
