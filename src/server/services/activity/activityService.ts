import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { assertNever } from "~/common/errorUtils";
import { noop } from "~/common/fnUtils";
import { db, schema } from "~/server/db";
import { type LmsAssignment } from "~/server/integrations/types";
import { getIntegrationApi } from "~/server/services/integrationService";
import { type IntegrationActivity } from "../../db/schema";

async function getCourseAndAssignment({
  userId,
  integrationActivity,
}: {
  userId: string;
  integrationActivity: IntegrationActivity;
}) {
  const integrationApi = await getIntegrationApi({
    userId,
    integrationId: integrationActivity.integrationId,
  });

  const course = await integrationApi.getCourse({
    userId,
    exCourseIdJson: integrationActivity.exCourseIdJson,
  });

  // ensure that the activity is associated with an assignment that's visible to the user
  // (hiding unpublished assignments from students)
  let assignment: LmsAssignment | null = null;
  for (const a of course.assignments) {
    if (a.integrationActivity.activityId !== integrationActivity.activityId) {
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

  return { course, assignment };
}

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
    where: eq(schema.activities.id, activityId),
    with: {
      integrationActivity: true,
      adHocActivity: true,
    },
  });
  if (!activity) {
    throw new Error("Activity not found");
  }

  const { integrationActivity, adHocActivity } = activity;

  if (integrationActivity) {
    const { course, assignment } = await getCourseAndAssignment({
      userId,
      integrationActivity,
    });
    return {
      ...activity,
      type: "integration" as const,
      course,
      assignment,

      // infers as non-nullable
      integrationActivity,
    };
  }

  if (adHocActivity) {
    return {
      ...activity,
      type: "adHoc" as const,

      // infers as non-nullable
      adHocActivity,
    };
  }

  throw new Error("Could not determine activity type");
}

export type RichActivity = Awaited<ReturnType<typeof getActivity>>;

export async function assertActivityAccess({
  userId,
  activityId,
}: {
  userId: string;
  activityId: string;
}) {
  await getActivity({ userId, activityId, assertAccess: true });
}
