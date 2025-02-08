import { z } from "zod";
import { MessageDeltaSchema } from "~/common/types";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { messageDeltaPubSub } from "~/server/db/pubsub/messageDeltaPubSub";
import { messagePubSub } from "~/server/db/pubsub/messagePubSub";
import { type Message } from "~/server/db/schema";
import { getActivity } from "~/server/services/activityService";

export const messageRouter = createTRPCRouter({
  newMessages: publicProcedure
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
  messageDeltas: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .subscription(async function* ({
      input,
      ctx,
    }): AsyncGenerator<MessageDeltaSchema> {
      const { activityId } = input;
      const { userId } = ctx;
      await getActivity({
        userId,
        activityId,
        assertAccess: true,
      });
      const messageDeltaSubscription = messageDeltaPubSub.subscribe();
      for await (const messageDelta of messageDeltaSubscription) {
        if (messageDelta.activityId === activityId) {
          yield messageDelta;
        }
      }
    }),
});
