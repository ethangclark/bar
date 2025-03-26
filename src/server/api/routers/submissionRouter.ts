import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { groupBy, indexById } from "~/common/indexUtils";
import { objectEntries } from "~/common/objectUtils";
import { type UserBasic } from "~/common/types";
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
  enrolleeSubmissionInfo: protectedProcedure
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
              isAdmin: true,
            } satisfies { [key in keyof UserBasic]: true },
          },
        },
      });

      const flags = await db.query.flags.findMany({
        where: eq(schema.flags.activityId, input.activityId),
      });

      const userIdToCompletions = groupBy(completions, "userId");

      const userIdToFlags = groupBy(flags, "userId");

      const data = objectEntries(userIdToCompletions).map(
        ([userId, completions]) => {
          const completion = completions[0];
          if (completion === undefined) {
            throw new Error("Completion is undefined");
          }
          const flags = userIdToFlags[userId] ?? [];
          return {
            user: completion.user,
            completions: completions.map(
              ({ user: _, ...completion }) => completion,
            ),
            flags,
          };
        },
      );

      return data;
    }),

  myCompletionTotals: protectedProcedure.query(
    async ({ ctx }): Promise<CompletionTotals> => {
      const { userId } = ctx;

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
