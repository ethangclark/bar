import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  messageDeltaPubSub,
  type MessageDelta,
} from "~/server/db/pubsub/messageDeltaPubSub";
import { messageController } from "~/server/descendents/messageController";
import { getActivity } from "~/server/services/activity/activityService";

export const messageRouter = createTRPCRouter({
  messageDeltas: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .subscription(async function* ({
      input,
      ctx,
    }): AsyncGenerator<MessageDelta> {
      const { activityId } = input;
      const { user } = ctx;
      const activity = await getActivity({
        user,
        activityId,
        assertAccess: true,
      });
      const messageDeltaSubscription = messageDeltaPubSub.subscribe();
      for await (const messageDelta of messageDeltaSubscription) {
        if (messageDelta.baseMessage.activityId === activityId) {
          if (
            messageController.canRead(messageDelta.baseMessage, {
              activityId,
              userId: user.id,
              enrolledAs: activity.enrolledAs,
            })
          ) {
            yield messageDelta;
          }
        }
      }
    }),
});
