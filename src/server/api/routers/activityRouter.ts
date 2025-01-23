import { z } from "zod";
import { modificationOpsSchema } from "~/common/utils/activityUtils";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  applyModificationOps,
  getActivity,
} from "~/server/services/activityService";

export const activityRouter = createTRPCRouter({
  details: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input, ctx }) => {
      const activity = await getActivity({
        assertAccess: true,
        userId: ctx.userId,
        activityId: input.activityId,
      });
      return activity;
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
