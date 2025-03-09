import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOne } from "~/common/assertions";
import { allEnrollmentTypes } from "~/common/enrollmentTypeUtils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db, schema } from "~/server/db";
import { activityStatusSchema } from "~/server/db/schema";
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
      const adHocActivities = await db
        .insert(schema.adHocActivities)
        .values({
          activityId: activity.id,
          creatorId: ctx.userId,
          title: input.title,
        })
        .returning();
      const adHocActivity = assertOne(adHocActivities);
      return {
        activity,
        adHocActivity,
        enrolledAs: allEnrollmentTypes, // this is a bit, uh, messy
      };
    }),
  updateStatus: protectedProcedure
    .input(z.object({ activityId: z.string(), status: activityStatusSchema }))
    .mutation(async ({ ctx, input }) => {
      const activity = await getActivity({
        assertAccess: true,
        userId: ctx.userId,
        activityId: input.activityId,
      });

      if (activity.type === "adHoc") {
        if (activity.adHocActivity.creatorId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not allowed to update this ad hoc activity",
          });
        }
        await db
          .update(schema.activities)
          .set({ status: input.status })
          .where(eq(schema.activities.id, input.activityId));
      } else {
        throw new Error(
          "Not yet implemented: non-ad-hoc activity status updates",
        );
      }
    }),
  deleteAdHocActivity: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adHocActivity = await db.query.adHocActivities.findFirst({
        where: and(
          eq(schema.adHocActivities.activityId, input.activityId),
          eq(schema.adHocActivities.creatorId, ctx.userId),
        ),
      });
      if (!adHocActivity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ad hoc activity not found",
        });
      }
      await db
        .delete(schema.activities)
        .where(eq(schema.activities.id, adHocActivity.activityId));
    }),
  updateAdHocActivity: protectedProcedure
    .input(z.object({ activityId: z.string(), title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adHocActivity = await db.query.adHocActivities.findFirst({
        where: and(
          eq(schema.adHocActivities.activityId, input.activityId),
          eq(schema.adHocActivities.creatorId, ctx.userId),
        ),
      });
      if (!adHocActivity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ad hoc activity not found",
        });
      }
      await db
        .update(schema.adHocActivities)
        .set({ title: input.title })
        .where(eq(schema.adHocActivities.activityId, input.activityId));
    }),
});
