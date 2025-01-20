import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertNever } from "~/common/utils/errorUtils";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { type LmsAssignment } from "~/server/integrations/utils/integrationApi";
import { getIntegrationApis } from "~/server/services/integrationService";

async function getActivity(activityId: string) {
  const activity = await db.query.activities.findFirst({
    where: eq(db.x.activities.id, activityId),
    with: {
      activityItems: {
        with: {
          question: true,
          infoBlock: {
            with: {
              infoImage: true,
            },
          },
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
      let assignment: LmsAssignment | null = null;
      for (const course of courses) {
        for (const a of course.assignments) {
          if (a.activity?.id !== activity.id) {
            continue;
          }
          if (
            course.enrolledAs.includes("teacher") ||
            course.enrolledAs.includes("ta") ||
            course.enrolledAs.includes("designer")
          ) {
            assignment = a;
          }
          switch (a.activity.status) {
            case "published":
              assignment = a;
            case "draft":
              // do nothing;
              continue;
          }
          assertNever(a.activity.status);
        }
      }
      if (!assignment) {
        throw new Error("Activity not found");
      }

      return { assignment, ...activity };
    }),
});
