import { z } from "zod";
import {
  createEmptyModifications,
  type Modifications,
  modificationsSchema,
} from "~/common/descendentUtils";
import { invoke } from "~/common/fnUtils";
import { objectKeys } from "~/common/objectUtils";
import { type MaybePromise } from "~/common/types";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import {
  controllers,
  modifyDescendents,
  readDescendents,
} from "~/server/descendents";
import { getActivity } from "~/server/services/activity/activityService";

export const descendentRouter = createTRPCRouter({
  read: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        includeUserIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { activityId, includeUserIds } = input;
      const { user } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        user,
        activityId,
      });

      // COMMENT_002a1
      // if changing this impl, also update the impl in COMMENT_002b1
      const agentEffectQueue = Array<() => MaybePromise<void>>();
      const enqueueSideEffect = (cb: () => MaybePromise<void>) => {
        agentEffectQueue.push(cb);
      };

      const result = await db.transaction(async (tx) => {
        return readDescendents({
          activityId,
          userId: user.id,
          enrolledAs: activity.enrolledAs,
          includeUserIds: includeUserIds ?? [],
          tx,
          enqueueSideEffect,
        });
      });

      // COMMENT_002a2
      // if changing this impl, also update the impl in COMMENT_002b2
      setTimeout(() => agentEffectQueue.forEach(invoke));

      return result;
    }),

  modify: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        modifications: modificationsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, modifications } = input;
      const { user } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        user,
        activityId,
      });

      // COMMENT_002b1
      // if changing this impl, also update the impl in COMMENT_002a1
      const agentEffectQueue = Array<() => MaybePromise<void>>();
      const enqueueSideEffect = (cb: () => MaybePromise<void>) => {
        agentEffectQueue.push(cb);
      };

      const result = await db.transaction(async (tx) => {
        return modifyDescendents({
          activityId,
          modifications,
          userId: user.id,
          enrolledAs: activity.enrolledAs,
          tx,
          enqueueSideEffect,
        });
      });

      // COMMENT_002b2
      // if changing this impl, also update the impl in COMMENT_002a2
      setTimeout(() => agentEffectQueue.forEach(invoke));

      return result;
    }),

  newDescendents: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .subscription(async function* ({
      input,
      ctx,
    }): AsyncGenerator<Modifications> {
      const { activityId } = input;
      const { user } = ctx;
      const activity = await getActivity({
        user,
        activityId,
        assertAccess: true,
      });
      const descendentSubscription = descendentPubSub.subscribe();
      for await (const modifications of descendentSubscription) {
        const safe = createEmptyModifications();

        let total = 0;

        objectKeys(modifications).forEach((opType) => {
          const descendents = modifications[opType];

          objectKeys(descendents).forEach((name) => {
            const controller = controllers[name];
            const filtered = descendents[name].filter(
              (descendent) =>
                descendent.activityId === activityId &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                controller.canRead(descendent as any, {
                  activityId,
                  userId: user.id,
                  enrolledAs: activity.enrolledAs,
                }),
            );
            total += filtered.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            safe[opType][name] = filtered as any;
          });
        });

        if (total > 0) {
          yield safe;
        }
      }
    }),
});
