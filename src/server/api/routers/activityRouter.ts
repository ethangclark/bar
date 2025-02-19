import { z } from "zod";
import { assertOne } from "~/common/arrayUtils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db, schema } from "~/server/db";
import {
  getActivity,
  getAllActivities,
} from "~/server/services/activity/activityService";

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
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const activities = await getAllActivities({ userId: ctx.userId });
    return activities;
  }),
  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const activities = await db
        .insert(schema.activities)
        .values({})
        .returning();
      const activity = assertOne(activities);
      const adHocActivity = await db
        .insert(schema.adHocActivities)
        .values({
          activityId: activity.id,
          creatorId: ctx.userId,
          title: input.title,
        })
        .returning();
      return { activity, adHocActivity };
    }),
});
