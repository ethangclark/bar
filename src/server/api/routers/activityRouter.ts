import { z } from "zod";
import { modificationOpsSchema } from "~/common/utils/activityUtils";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import {
  applyModificationOps,
  getActivity,
} from "~/server/services/activityService";
import { getEvalKeys } from "~/server/services/evalKeyService";

export const activityRouter = createTRPCRouter({
  details: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input, ctx }) => {
      const activity = await getActivity({
        assertAccess: true,
        userId: ctx.userId,
        activityId: input.activityId,
      });
      const { questionIdToEvalKey } = await getEvalKeys(activity, db);
      return {
        ...activity,
        questionIdToEvalKey,
      };
    }),

  modifyActivity: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        modificationOps: modificationOpsSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { activityId, modificationOps } = input;
      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });
      await applyModificationOps({
        ensureOpsFitActivity: true,
        activity,
        modificationOps,
      });
    }),
});
