import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { indexById } from "~/common/indexUtils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db, schema } from "~/server/db";
import { getActivity } from "~/server/services/activity/activityService";

export type CompletionTotals = {
  [key: string]: {
    completionCount: number;
    itemCount: number;
  };
};

export const submissionRouter = createTRPCRouter({
  enrolleeCompletions: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input, ctx }) => {
      const activity = await getActivity({
        assertAccess: true,
        userId: ctx.userId,
        activityId: input.activityId,
      });
      if (!isGrader(activity.enrolledAs)) {
        return [];
      }

      // TODO: rewrite this to include completion and item counts
      // (probably means its indexed differently)
      const completions = await db.query.completions.findMany({
        where: eq(schema.completions.activityId, input.activityId),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              isInstructor: true,
              requestedInstructorAccess: true,
            },
          },
        },
      });
      return completions;
    }),

  myCompletionTotals: protectedProcedure.query(
    async ({ ctx }): Promise<CompletionTotals> => {
      const { userId } = ctx;

      // TODO: rewrite this to include completion and item counts
      // (probably means its indexed differently)
      const completions = await db.query.completions.findMany({
        where: eq(schema.completions.userId, userId),
      });

      const activityIds = completions.map((c) => c.activityId);

      const activities = await db.query.activities.findMany({
        where: inArray(schema.activities.id, activityIds),
        with: {
          items: true,
          completions: {
            where: eq(schema.completions.userId, userId),
          },
        },
      });

      const activitesWithCompletionCounts = activities.map(
        ({ completions, items, ...rest }) => ({
          ...rest,
          completionCount: completions.length,
          itemCount: items.length,
        }),
      );

      return indexById(activitesWithCompletionCounts);
    },
  ),
});
