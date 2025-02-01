import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { assertNever } from "~/common/errorUtils";
import { noop } from "~/common/fnUtils";
import { db } from "~/server/db";
import { type LmsAssignment } from "~/server/integrations/utils/integrationApi";
import { getIntegrationApi } from "~/server/services/integrationService";

export async function getActivity({
  userId,
  activityId,
  assertAccess,
}: {
  userId: string;
  activityId: string;
  assertAccess: true;
}) {
  // this is just to call out what exactly the function is responsible for
  noop(assertAccess);

  const activity = await db.query.activities.findFirst({
    where: eq(db.x.activities.id, activityId),
  });
  if (!activity) {
    throw new Error("Activity not found");
  }

  const integrationApi = await getIntegrationApi({
    userId,
    integrationId: activity.integrationId,
  });

  const course = await integrationApi.getCourse({
    userId,
    exCourseIdJson: activity.exCourseIdJson,
  });

  // ensure that the activity is associated with an assignment that's visible to the user
  // (hiding unpublished assignments from students)
  let assignment: LmsAssignment | null = null;
  for (const a of course.assignments) {
    if (a.activity?.id !== activity.id) {
      continue;
    }
    if (isDeveloper(course.enrolledAs)) {
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
  if (!course || !assignment) {
    throw new Error("Activity not found");
  }

  return { ...activity, course, assignment };
}

export async function assertActivityAccess({
  userId,
  activityId,
}: {
  userId: string;
  activityId: string;
}) {
  await getActivity({ userId, activityId, assertAccess: true });
}
