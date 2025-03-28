import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  type ThreadWrap,
  threadWrapPubSub,
} from "~/server/db/pubsub/threadWrapPubSub";
import { getActivity } from "~/server/services/activity/activityService";

export const threadWrapRouter = createTRPCRouter({
  threadWraps: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .subscription(async function* ({ input, ctx }): AsyncGenerator<ThreadWrap> {
      const { activityId } = input;
      const { user } = ctx;
      await getActivity({
        user,
        activityId,
        assertAccess: true,
      });
      const threadWrapSubscription = threadWrapPubSub.subscribe();
      for await (const threadWrap of threadWrapSubscription) {
        if (threadWrap.activityId === activityId) {
          yield threadWrap;
        }
      }
    }),
});
