import { message } from "antd";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { messagePubSub } from "~/server/db/pubsub/messagePubSub";
import { Message } from "~/server/db/schema";
import { getActivity } from "~/server/services/activityService";

export const messageRouter = createTRPCRouter({
  messages: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .subscription(async function* ({ input, ctx }): AsyncGenerator<Message[]> {
      const { activityId } = input;
      const { userId } = ctx;
      await getActivity({
        userId,
        activityId,
        assertAccess: true,
      });
      const messageSubscription = messagePubSub.subscribe();
      for await (const messages of messageSubscription) {
        const filtered = messages.filter(
          (message) =>
            message.activityId === activityId &&
            message.userId === userId &&
            ["assistant", "user"].includes(message.senderRole),
        );
        if (filtered.length > 0) {
          yield filtered;
        }
      }
    }),
});
