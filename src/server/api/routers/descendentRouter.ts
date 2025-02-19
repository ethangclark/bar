import { z } from "zod";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { getEnrolledAs } from "~/common/enrollmentTypeUtils";
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
import {
  type Descendents,
  modificationsSchema,
} from "~/server/descendents/descendentTypes";
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
          enrolledAs: getEnrolledAs(activity),
          includeUserIds: includeUserIds ?? [],
          tx,
        });
      });
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
          enrolledAs: getEnrolledAs(activity),
          tx,
          enqueueAgentEffect,
        });
      });

      setTimeout(() => agentEffectQueue.forEach(invoke));

      return result;
    }),

  newDescendents: protectedProcedure
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
                enrolledAs: getEnrolledAs(activity),
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
