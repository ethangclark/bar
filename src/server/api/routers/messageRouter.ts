import { z } from "zod";
import { type MessageDeltaSchema } from "~/common/types";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { messageDeltaPubSub } from "~/server/db/pubsub/messageDeltaPubSub";
import { getActivity } from "~/server/services/activity/activityService";

export const messageRouter = createTRPCRouter({
  messageDeltas: protectedProcedure
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
