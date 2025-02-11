import { z } from "zod";
import { invoke } from "~/common/fnUtils";
import { type MaybePromise } from "~/common/types";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { modifyDescendents, readDescendents } from "~/server/descendents";
import { modificationsSchema } from "~/server/descendents/descendentTypes";
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

      const postTxQueue = Array<() => MaybePromise<void>>();
      const afterTx = (cb: () => MaybePromise<void>) => {
        postTxQueue.push(cb);
      };

      const result = await db.transaction(async (tx) => {
        return modifyDescendents({
          activityId,
          modifications,
          userId,
          enrolledAs: activity.course.enrolledAs,
          tx,
          afterTx,
        });
      });

      setTimeout(() => postTxQueue.forEach(invoke));

      return result;
    }),
});
