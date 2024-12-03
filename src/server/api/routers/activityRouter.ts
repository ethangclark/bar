import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export const activityRouter = createTRPCRouter({
  enrollmentActivities: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { enrollmentId } = input;
      const activities = await db.query.activities.findMany({
        where: and(
          eq(dbSchema.activities.enrollmentId, enrollmentId),
          eq(dbSchema.activities.userId, ctx.session.user.id),
        ),
      });
      return activities;
    }),
});
