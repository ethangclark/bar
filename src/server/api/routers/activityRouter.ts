import { z } from "zod";
import { assertOne } from "~/common/arrayUtils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { getActivity } from "~/server/services/activity/activityService";

export const activityRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input, ctx }) => {
      const activity = await getActivity({
        assertAccess: true,
        userId: ctx.userId,
        activityId: input.activityId,
      });
      return activity;
    }),
  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const activities = await db
        .insert(db.x.activities)
        .values({})
        .returning();
      const activity = assertOne(activities);
      const adHocActivity = await db
        .insert(db.x.adHocActivities)
        .values({
          activityId: activity.id,
          creatorId: ctx.userId,
          title: input.title,
        })
        .returning();
      return { activity, adHocActivity };
    }),
});
