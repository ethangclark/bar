import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { getIntegrationApis } from "~/server/services/integrationService";

async function getActivity(activityId: string) {
  const activity = await db.query.activities.findFirst({
    where: eq(db.x.activities.id, activityId),
    with: {
      activityItems: {
        with: {
          question: true,
          infoText: true,
          infoImage: true,
        },
      },
    },
  });
  if (!activity) {
    throw new Error("Activity not found");
  }
  return activity;
}

export const activityRouter = createTRPCRouter({
  details: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;
      const [integrationApis, activity] = await Promise.all([
        getIntegrationApis(userId),
        getActivity(input.activityId),
      ]);

      const integrationApi = integrationApis.find(
        (i) => i.integration.id === activity.integrationId,
      );

      // ensure that the activity belongs to an integration that's associated with the user
      if (!integrationApi) {
        throw new Error("Activity not found");
      }

      // ensure that the activity is associated with an assignment that's visible to the user
      // (hiding unpublished assignments from students)
      const courses = await integrationApi.getCourses({ userId });
      if (
        !courses.some((c) =>
          c.assignments.some((a): boolean => {
            const exists = a.activity?.id === activity.id;
            if (!exists) {
              return false;
            }
            if (
              c.enrolledAs.includes("teacher") ||
              c.enrolledAs.includes("ta") ||
              c.enrolledAs.includes("designer")
            ) {
              return true;
            }
            switch (a.activity.status) {
              case "published":
                return true;
              case "draft":
                return false;
            }
          }),
        )
      ) {
        throw new Error("Activity not found");
      }

      return activity;
    }),
});
