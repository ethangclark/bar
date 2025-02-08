import { eq } from "drizzle-orm";
import { db } from "../db";
import { messageDeltaPubSub } from "../db/pubsub/messageDeltaPubSub";
import { type Message } from "../db/schema";
import { streamLlmResponse } from "../ai/llm";
import { messagePubSub } from "../db/pubsub/messagePubSub";

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

  const [newMessage, ...excessMessages] = newMessageArr;
  if (!newMessage || excessMessages.length > 0) {
    throw new Error(
      `Failed to create singular new message; created ${newMessageArr.length} new messages.`,
    );
  }

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

  // could break this out into a function
  let complete = "";
  let partial = "";
  let lastPublish = new Date(0);
  for await (const resp of gen) {
    if (typeof resp !== "string") {
      return;
    }
    complete += resp;
    partial += resp;
    const now = new Date();
    if (now.getTime() - lastPublish.getTime() > 200) {
      void messageDeltaPubSub.publish({
        activityId,
        messageId: newMessage.id,
        contentDelta: partial,
      });
      lastPublish = now;
      partial = "";
    }
  }
  if (partial.length > 0) {
    void messageDeltaPubSub.publish({
      activityId,
      messageId: newMessage.id,
      contentDelta: partial,
    });
  }

  await db
    .update(db.x.messages)
    .set({
      content: complete,
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
