import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { activityItemWithChildrenSchema } from "~/server/db/schema";
import { getActivity } from "~/server/services/activityService";

const modificationOps = z.object({
  toCreate: z.array(activityItemWithChildrenSchema),
  toUpdate: z.array(activityItemWithChildrenSchema),
  toDelete: z.array(z.string()),
});
export type ModificationOps = z.infer<typeof modificationOps>;

export const activityRouter = createTRPCRouter({
  details: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input, ctx }) => {
      const activity = await getActivity({
        userId: ctx.userId,
        activityId: input.activityId,
      });
      return activity;
    }),

  modifyActivity: publicProcedure
    .input(z.object({ activityId: z.string(), modificationOps }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { activityId, modificationOps } = input;
      const activity = await getActivity({ userId, activityId });
      const { toCreate, toUpdate, toDelete } = modificationOps;

      console.log({ activity, toCreate, toUpdate, toDelete });
      // TODO: apply modifications to activity
    }),
});
