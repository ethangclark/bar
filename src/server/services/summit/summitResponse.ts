import { eq } from "drizzle-orm";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { streamLlmResponse } from "~/server/ai/llm";
import { db } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import { messageDeltaPubSub } from "~/server/db/pubsub/messageDeltaPubSub";
import { type Message } from "~/server/db/schema";
import { publishNextIncompleteMessage } from "./nextIncompleteMessage";
import { postProcessAssistantResponse } from "./postProcessor";
import { debouncePublish } from "./utils";

export async function updateAndPublishCompletion(assistantResponse: Message) {
  const updates = {
    completed: true,
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
      .update(db.x.messages)
      .set(updates)
      .where(eq(db.x.messages.id, assistantResponse.id)),
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

  try {
    const gen = streamLlmResponse(
      emptyIncompleteMessage.userId,
      {
        model: "google/gemini-2.0-flash-thinking-exp:free",
        messages: oldMessages.map((m) => ({
          role: m.senderRole,
          content: m.content,
        })),
      },
      db,
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

    const messages = [...oldMessages, streamedIncompleteMessage];

    await Promise.all([
      db
        .update(db.x.messages)
        .set({
          content: streamed,
        })
        .where(eq(db.x.messages.id, emptyIncompleteMessage.id)),
      postProcessAssistantResponse(streamedIncompleteMessage, messages),
    ]);
    await updateAndPublishCompletion(streamedIncompleteMessage);
  } catch (error) {
    await updateAndPublishCompletion(emptyIncompleteMessage);
    throw error;
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
          respondToThread({ userId, activityId, threadId }).catch((e) => {
            console.error(e);
          }),
        );
      }
    }
  }
  await Promise.all(promises);
}
