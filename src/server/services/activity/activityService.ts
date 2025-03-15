import { eq } from "drizzle-orm";
import {
  allEnrollmentTypes,
  type EnrollmentType,
} from "~/common/enrollmentTypeUtils";
import { noop } from "~/common/fnUtils";
import { db, schema } from "~/server/db";
import {
  getAssignmentActivities,
  getCourseAndAssignment,
} from "./activityCourses";

async function getEnrolledAs({
  activityId,
  creatorId,
  userId,
  skipAutoEnroll,
}: {
  for: "adhoc"; // important; anyone can enroll in an adhoc activity by just having the link (with current model)
  activityId: string;
  creatorId: string;
  userId: string;
  skipAutoEnroll?: true;
}): Promise<EnrollmentType[]> {
  if (creatorId === userId) {
    return allEnrollmentTypes;
  }

  if (!skipAutoEnroll) {
    // automatically enroll the user in the activity
    await db
      .insert(schema.studentActivities)
      .values({
        activityId,
        userId,
      })
      .onConflictDoNothing({
        target: [
          schema.studentActivities.activityId,
          schema.studentActivities.userId,
        ],
      });
  }

  return ["student"];
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { adHocActivity, ...rest } = activity;
    return {
      ...rest,
      type: "integration" as const,
      course,
      assignment,
      integrationActivity, // infers as non-nullable
      enrolledAs: course.enrolledAs,
    };
  }

  if (adHocActivity) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { integrationActivity, ...rest } = activity;
    const enrolledAs = await getEnrolledAs({
      for: "adhoc",
      activityId,
      creatorId: adHocActivity.creatorId,
      userId,
    });
    return {
      ...rest,
      type: "adHoc" as const,
      adHocActivity, // infers as non-nullable
      enrolledAs,
    };
  }

  throw new Error("Could not determine activity type");
}

// we're sort of mushing together the adHocActivity and integrationActivity
// into a single type, but it works for now (and at least it's represented
// in an explicit union type)
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

export async function getAllActivities({
  userId,
}: {
  userId: string;
}): Promise<RichActivity[]> {
  const result = Array<RichActivity>();
  const assignmentActivities = await getAssignmentActivities({ userId });
  for (const assignmentActivity of assignmentActivities) {
    result.push({
      ...assignmentActivity.activity,
      type: "integration" as const,
      course: assignmentActivity.course,
      assignment: assignmentActivity.assignment,
      integrationActivity: assignmentActivity.integrationActivity,
      enrolledAs: assignmentActivity.course.enrolledAs,
    });
  }

  const adHocActivities = await db.query.adHocActivities.findMany({
    where: eq(schema.adHocActivities.creatorId, userId),
    with: {
      activity: true,
    },
  });
  for (const adHocActivity of adHocActivities) {
    const enrolledAs = await getEnrolledAs({
      for: "adhoc",
      skipAutoEnroll: true, // HACK: if they're loading a bunch, don't auto-enroll them (for performance/sanity's sake) (need to refactor around this)
      activityId: adHocActivity.activityId,
      creatorId: adHocActivity.creatorId,
      userId,
    });
    result.push({
      ...adHocActivity.activity,
      type: "adHoc" as const,
      adHocActivity,
      enrolledAs,
    });
  }

  return result;
}
