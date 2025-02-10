import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { messageDeltaPubSub } from "~/server/db/pubsub/messageDeltaPubSub";
import { type Message } from "~/server/db/schema";
import { streamLlmResponse } from "~/server/ai/llm";
import { messagePubSub } from "~/server/db/pubsub/messagePubSub";
import { debouncePublish } from "./utils";
import { assertOne } from "~/common/arrayUtils";

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
      })
      .returning(),
  ]);

  const newMessage = assertOne(newMessageArr);

  const oldMessages = rawMessages
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .filter((m) => m.id !== newMessage.id);

  await messagePubSub.publish([newMessage]);

  const gen = streamLlmResponse(
    newMessage.userId,
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
    if (!newMessage) {
      throw new Error("No new message created.");
    }
    void messageDeltaPubSub.publish({
      activityId,
      messageId: newMessage.id,
      contentDelta: delta,
    });
  }

  const { generated } = await debouncePublish(gen, 200, publish);

  await db
    .update(db.x.messages)
    .set({
      content: generated,
    })
    .where(eq(db.x.messages.id, newMessage.id));
}

export async function respondToUserMessages(userMessages: Message[]) {
  // userIdToActivityIdToThreadIds
  const u2a2ts: Record<string, Record<string, Set<string>>> = {};
  for (const m of userMessages) {
    const a2ts = u2a2ts[m.userId] ?? {};
    u2a2ts[m.userId] = a2ts;
    const ts = a2ts[m.activityId] ?? new Set();
    a2ts[m.activityId] = ts;
    ts.add(m.threadId);
  }
  for (const [userId, a2ts] of Object.entries(u2a2ts)) {
    for (const [activityId, ts] of Object.entries(a2ts)) {
      for (const threadId of ts) {
        void respondToThread({ userId, activityId, threadId });
      }
    }
  }
}
