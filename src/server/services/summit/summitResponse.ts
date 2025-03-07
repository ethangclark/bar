import { eq } from "drizzle-orm";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { invoke } from "~/common/fnUtils";
import { streamLlmResponse } from "~/server/ai/llm";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import { messageDeltaPubSub } from "~/server/db/pubsub/messageDeltaPubSub";
import { type Message } from "~/server/db/schema";
import { publishNextIncompleteMessage } from "./nextIncompleteMessage";
import { postProcessAssistantResponse } from "./postProcessor";
import { debouncePublish } from "./utils";

export async function updateAndPublishCompletion(assistantResponse: Message) {
  const updates = {
    doneGenerating: true,
  };

  const updatedMessage = {
    ...assistantResponse,
    ...updates,
  };
  const descendent = {
    ...createEmptyDescendents(),
    messages: [updatedMessage],
  };

  await Promise.all([
    db
      .update(schema.messages)
      .set(updates)
      .where(eq(schema.messages.id, assistantResponse.id)),
    descendentPubSub.publish(descendent),
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
      model: "google/gemini-2.0-flash-001",
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
      activityId,
      messageId: emptyIncompleteMessage.id,
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

  await Promise.all([
    invoke(async () => {
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
      await postProcessAssistantResponse(
        streamedIncompleteMessage,
        messagesWithDescendents,
        { totalTokens },
      );
    }),
    updateAndPublishCompletion(streamedIncompleteMessage),
  ]);
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
