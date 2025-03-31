import { and, eq, inArray, not } from "drizzle-orm";
import { streamLlmResponse } from "~/server/ai/llm";
import { defaultModel } from "~/server/ai/llm/types";
import { db, schema } from "~/server/db";
import { messageDeltaPubSub } from "~/server/db/pubsub/messageDeltaPubSub";
import { type Message } from "~/server/db/schema";
import { postProcess, type RetryHistory } from "./postProcessing/postProcessor";
import { publishNewIncompleteMessage } from "./preProcessing/beginResponse";
import { debouncePublish } from "./utils";

async function respondToThread({
  userId,
  activityId,
  threadId,
  retryHistory,
}: {
  userId: string;
  activityId: string;
  threadId: string;
  retryHistory: RetryHistory | null;
}) {
  const replyAttemptIds = new Set(
    retryHistory?.prevResponseAttempts.map((m) => m.id) ?? [],
  );

  const { emptyIncompleteMessage, oldMessages } =
    await publishNewIncompleteMessage({
      userId,
      activityId,
      threadId,
    });

  let threadTokenLength = 0;
  const gen = streamLlmResponse(
    emptyIncompleteMessage.userId,
    {
      model: defaultModel,
      messages: oldMessages
        .filter((m) => !replyAttemptIds.has(m.id))
        .map((m) => ({
          role: m.senderRole,
          content: m.content,
        })),
    },
    db,
    (tt) => {
      threadTokenLength = tt;
    },
  );

  const { streamed } = await debouncePublish(gen, 200, (delta) =>
    messageDeltaPubSub.publish({
      baseMessage: emptyIncompleteMessage,
      contentDelta: delta,
    }),
  );

  const streamedIncompleteMessage = {
    ...emptyIncompleteMessage,
    content: streamed,
  };

  await db
    .update(schema.messages)
    .set({
      content: streamed,
    })
    .where(eq(schema.messages.id, emptyIncompleteMessage.id));

  const prevMessages = await db.query.messages.findMany({
    where: and(
      eq(schema.messages.threadId, threadId),
      not(inArray(schema.messages.id, Array.from(replyAttemptIds))),
    ),
    with: {
      viewPieces: {
        with: {
          images: {
            with: {
              infoImage: true,
            },
          },
          videos: {
            with: {
              infoVideo: true,
            },
          },
          texts: true,
        },
      },
    },
  });

  const { needsRetry, retryHistory: nextRetryHistory } = await postProcess(
    streamedIncompleteMessage,
    prevMessages,
    retryHistory,
    threadTokenLength,
  );
  if (needsRetry) {
    await respondToThread({
      userId,
      activityId,
      threadId,
      retryHistory: nextRetryHistory,
    });
  }
}

export async function respondToUserMessages(userMessages: Message[]) {
  // userIdToActivityIdToThreadIds
  const u2a2ts: { [key: string]: { [key: string]: Set<string> } } = {};
  for (const m of userMessages) {
    const a2ts = u2a2ts[m.userId] ?? {};
    u2a2ts[m.userId] = a2ts;
    const ts = a2ts[m.activityId] ?? new Set();
    a2ts[m.activityId] = ts;
    ts.add(m.threadId);
  }
  const promises: Array<Promise<void>> = [];
  for (const [userId, a2ts] of Object.entries(u2a2ts)) {
    for (const [activityId, ts] of Object.entries(a2ts)) {
      for (const threadId of ts) {
        promises.push(
          respondToThread({
            userId,
            activityId,
            threadId,
            retryHistory: null,
          }).catch((e) => {
            console.error(e);
          }),
        );
      }
    }
  }
  await Promise.all(promises);
}
