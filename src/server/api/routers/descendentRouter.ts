import { z } from "zod";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { invoke } from "~/common/fnUtils";
import { objectKeys } from "~/common/objectUtils";
import { type MaybePromise } from "~/common/types";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import {
  controllers,
  modifyDescendents,
  readDescendents,
} from "~/server/descendents";
import {
  type Descendents,
  modificationsSchema,
} from "~/server/descendents/descendentTypes";
import { getActivity } from "~/server/services/activityService";

export const descendentRouter = createTRPCRouter({
  read: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        includeUserIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { activityId, includeUserIds } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return readDescendents({
          activityId,
          userId,
          enrolledAs: activity.course.enrolledAs,
          includeUserIds: includeUserIds ?? [],
          tx,
        });
      });
    }),

  modify: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        modifications: modificationsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, modifications } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      const agentEffectQueue = Array<() => MaybePromise<void>>();
      const enqueueAgentEffect = (cb: () => MaybePromise<void>) => {
        agentEffectQueue.push(cb);
      };

      const result = await db.transaction(async (tx) => {
        return modifyDescendents({
          activityId,
          modifications,
          userId,
          enrolledAs: activity.course.enrolledAs,
          tx,
          enqueueAgentEffect,
        });
      });

      setTimeout(() => agentEffectQueue.forEach(invoke));

      return result;
    }),

  newDescendents: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .subscription(async function* ({
      input,
      ctx,
    }): AsyncGenerator<Descendents> {
      const { activityId } = input;
      const { userId } = ctx;
      const activity = await getActivity({
        userId,
        activityId,
        assertAccess: true,
      });
      const descendentSubscription = descendentPubSub.subscribe();
      for await (const descendents of descendentSubscription) {
        const safe = createEmptyDescendents();

        let total = 0;

        objectKeys(descendents).forEach((name) => {
          const controller = controllers[name];
          const filtered = descendents[name].filter(
            (descendent) =>
              descendent.activityId === activityId &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              controller.canRead(descendent as any, {
                activityId,
                userId,
                enrolledAs: activity.course.enrolledAs,
              }),
          );
          total += filtered.length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          safe[name] = filtered as any;
        });

        if (total > 0) {
          yield safe;
        }
      }
    }),
});
