import { eq } from "drizzle-orm";
import { db, DbOrTx } from "../db";
import { messageDeltaPubSub } from "../db/pubsub/messageDeltaPubSub";
import { Message } from "../db/schema";
import { streamLlmResponse } from "../ai/llm";

const model = "deepseek/deepseek-chat";

export async function streamResponse(toMessage: Message) {
  let messages = await db.query.messages.findMany({
    where: eq(db.x.messages.threadId, toMessage.threadId),
  });
  messages = messages
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .filter((m) => m.id !== toMessage.id);

  const gen = streamLlmResponse(
    toMessage.userId,
    {
      model,
      messages: messages.map((m) => ({
        role: m.senderRole,
        content: m.content,
      })),
    },
    db,
  );
  for await (const resp of gen) {
    if (typeof resp === "string") {
      messageDeltaPubSub.publish({
        activityId: toMessage.activityId,
        messageId: toMessage.id,
        contentDelta: resp,
      });
    }
  }
}
