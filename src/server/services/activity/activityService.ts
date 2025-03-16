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

const adHocEnrollmentTypes = ["student"] as const satisfies EnrollmentType[];

async function ensureAutoEnrollment({
  adHocActivityId,
  userId,
}: {
  adHocActivityId: string;
  userId: string;
}): Promise<void> {
  await db
    .insert(schema.standaloneEnrollments)
    .values({ adHocActivityId, userId })
    .onConflictDoNothing({
      target: [
        schema.standaloneEnrollments.adHocActivityId,
        schema.standaloneEnrollments.userId,
      ],
    });
}

function getEnrolledAs({
  creatorId,
  userId,
}: {
  isAdHocActivity: true; // important; this only applies to adHoc activities
  creatorId: string;
  userId: string;
}): EnrollmentType[] {
  return creatorId === userId ? allEnrollmentTypes : adHocEnrollmentTypes;
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
    const enrolledAs = getEnrolledAs({
      isAdHocActivity: true,
      creatorId: adHocActivity.creatorId,
      userId,
    });

    await ensureAutoEnrollment({
      adHocActivityId: adHocActivity.id,
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
    const enrolledAs = getEnrolledAs({
      isAdHocActivity: true,
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

  const standaloneEnrollments = await db.query.standaloneEnrollments.findMany({
    where: eq(schema.standaloneEnrollments.userId, userId),
    with: {
      adHocActivity: {
        with: {
          activity: true,
        },
      },
    },
  });
  for (const standaloneEnrollment of standaloneEnrollments) {
    const { adHocActivity } = standaloneEnrollment;
    result.push({
      ...adHocActivity.activity,
      adHocActivity,
      type: "adHoc" as const,
      enrolledAs: adHocEnrollmentTypes,
    });
  }

  return result;
}
