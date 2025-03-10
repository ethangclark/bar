import { eq } from "drizzle-orm";
import { z } from "zod";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db, schema } from "~/server/db";
import { getActivity } from "~/server/services/activity/activityService";

export const submissionRouter = createTRPCRouter({
  allCompletions: protectedProcedure
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
            },
          },
        },
      });
      return completions;
    }),
});
