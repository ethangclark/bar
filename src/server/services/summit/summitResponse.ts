import { eq } from "drizzle-orm";
import { assertOne } from "~/common/arrayUtils";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { streamLlmResponse } from "~/server/ai/llm";
import { db } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import { messageDeltaPubSub } from "~/server/db/pubsub/messageDeltaPubSub";
import { type Message } from "~/server/db/schema";
import { postProcessAssistantResponse } from "./postProcessor";
import { debouncePublish } from "./utils";

const model = "google/gemini-2.0-flash-thinking-exp:free";

async function respondToThread({
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
      where: eq(db.x.messages.threadId, threadId),
    }),
    db
      .insert(db.x.messages)
      .values({
        activityId,
        userId,
        threadId,
        senderRole: "assistant" as const,
        content: "",
        completed: false, // needs post-processing
      })
      .returning(),
  ]);

  const newEmptyMessage = assertOne(newMessageArr);

  const oldMessages = rawMessages
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .filter((m) => m.id !== newEmptyMessage.id);

  const descendents = createEmptyDescendents();
  descendents.messages.push(newEmptyMessage);
  await descendentPubSub.publish(descendents);

  const gen = streamLlmResponse(
    newEmptyMessage.userId,
    {
      model,
      messages: oldMessages.map((m) => ({
        role: m.senderRole,
        content: m.content,
      })),
    },
    db,
  );

  function publish(delta: string) {
    if (!newEmptyMessage) {
      throw new Error("No new message created.");
    }
    void messageDeltaPubSub.publish({
      activityId,
      messageId: newEmptyMessage.id,
      contentDelta: delta,
    });
  }

  const { generated } = await debouncePublish(gen, 200, publish);

  const newMessage = {
    ...newEmptyMessage,
    content: generated,
  };

  const messages = [...oldMessages, newMessage];

  await Promise.all([
    db
      .update(db.x.messages)
      .set({
        content: generated,
      })
      .where(eq(db.x.messages.id, newEmptyMessage.id)),
    postProcessAssistantResponse(newMessage, messages),
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
