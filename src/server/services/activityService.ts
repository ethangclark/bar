import { eq } from "drizzle-orm";
import { assertNever } from "~/common/utils/errorUtils";
import { db } from "~/server/db";
import { type LmsAssignment } from "~/server/integrations/utils/integrationApi";
import { getIntegrationApis } from "~/server/services/integrationService";

export async function getActivity_UNSAFE(activityId: string) {
  const activity = await db.query.activities.findFirst({
    where: eq(db.x.activities.id, activityId),
    with: {
      activityItems: {
        with: {
          questions: true,
          infoTexts: true,
          infoImages: true,
        },
      },
    },
  });
  if (!activity) {
    throw new Error("Activity not found");
  }
  return activity;
}

export async function getActivity({
  userId,
  activityId,
}: {
  userId: string;
  activityId: string;
}) {
  const [integrationApis, activity] = await Promise.all([
    getIntegrationApis(userId),
    getActivity_UNSAFE(activityId),
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
}

export async function assertActivityAccess({
  userId,
  activityId,
}: {
  userId: string;
  activityId: string;
}) {
  await getActivity({ userId, activityId });
}
