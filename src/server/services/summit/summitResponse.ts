import { eq } from "drizzle-orm";
import { streamLlmResponse } from "~/server/ai/llm";
import { defaultModel } from "~/server/ai/llm/types";
import { db, schema } from "~/server/db";
import { publishDescendentUpserts } from "~/server/db/pubsub/descendentPubSub";
import { messageDeltaPubSub } from "~/server/db/pubsub/messageDeltaPubSub";
import { type Message } from "~/server/db/schema";
import { publishNextIncompleteMessage } from "./nextIncompleteMessage";
import { postProcessAssistantResponse } from "./postProcessor";
import { debouncePublish } from "./utils";

export async function updateAndPublishCompletion(
  assistantResponse: Message,
  { hasViewPieces }: { hasViewPieces: boolean },
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
    db
      .update(schema.messages)
      .set(updates)
      .where(eq(schema.messages.id, assistantResponse.id)),
    publishDescendentUpserts({
      messages: [updatedMessage],
    }),
  ]);
}

async function respondToThread({
  userId,
  activityId,
  threadId,
}: {
  userId: string;
  activityId: string;
  threadId: string;
}) {
  const { emptyIncompleteMessage, oldMessages } =
    await publishNextIncompleteMessage({
      userId,
      activityId,
      threadId,
    });

  let totalTokens = 0;
  const gen = streamLlmResponse(
    emptyIncompleteMessage.userId,
    {
      model: defaultModel,
      messages: oldMessages.map((m) => ({
        role: m.senderRole,
        content: m.content,
      })),
    },
    db,
    (tt) => {
      totalTokens = tt;
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

  const messagesWithDescendents = await db.query.messages.findMany({
    where: eq(schema.messages.threadId, threadId),
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
  const { hasViewPieces } = await postProcessAssistantResponse(
    streamedIncompleteMessage,
    messagesWithDescendents,
    { totalTokens },
  );
  await updateAndPublishCompletion(streamedIncompleteMessage, {
    hasViewPieces,
  });
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
          respondToThread({ userId, activityId, threadId }).catch((e) => {
            console.error(e);
          }),
        );
      }
    }
  }
  await Promise.all(promises);
}
