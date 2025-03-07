import { assertOne } from "~/common/assertions";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import { threadWrapPubSub } from "~/server/db/pubsub/threadWrapPubSub";
import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { injectCompletions } from "./completionInjector";
import { injectMedia } from "./mediaInjection/mediaInjector";
import { insertIntroMessages } from "./summitIntro";

async function wrapThreadOnTokenLimit({
  userId,
  activityId,
  totalTokens,
}: {
  userId: string;
  activityId: string;
  totalTokens: number;
}) {
  if (totalTokens > 25000) {
    const threads = await db
      .insert(schema.threads)
      .values({ activityId, userId })
      .returning();
    const thread = assertOne(threads);
    const messages = await insertIntroMessages(thread);

    await descendentPubSub.publish({
      ...createEmptyDescendents(),
      threads,
      messages,
    });

    threadWrapPubSub.publish({
      threadId: thread.id,
      userId,
      activityId,
      reason: "token-limit",
    });
  }
}

export async function postProcessAssistantResponse(
  assistantResponse: Message,
  prevMessages: MessageWithDescendents[],
  { totalTokens }: { totalTokens: number },
) {
  await Promise.all([
    injectMedia(assistantResponse, prevMessages),
    injectCompletions(assistantResponse, prevMessages),
  ]);

  await wrapThreadOnTokenLimit({
    userId: assistantResponse.userId,
    activityId: assistantResponse.activityId,
    totalTokens,
  });
}
