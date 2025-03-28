import { eq } from "drizzle-orm";
import {
  allEnrollmentTypes,
  type EnrollmentType,
} from "~/common/enrollmentTypeUtils";
import { noop } from "~/common/fnUtils";
import { db, schema } from "~/server/db";
import { type User } from "~/server/db/schema";
import {
  getAssignmentActivities,
  getCourseAndAssignment,
} from "./activityCourses";

const standaloneEnrollmentTypes = [
  "student",
] as const satisfies EnrollmentType[];

async function ensureAutoEnrollment({
  standaloneActivityId,
  userId,
}: {
  standaloneActivityId: string;
  userId: string;
}): Promise<void> {
  await db
    .insert(schema.standaloneEnrollments)
    .values({ standaloneActivityId, userId })
    .onConflictDoNothing({
      target: [
        schema.standaloneEnrollments.standaloneActivityId,
        schema.standaloneEnrollments.userId,
      ],
    });
}

function getEnrolledAs({
  creatorId,
  user,
}: {
  isStandaloneActivity: true; // important; this only applies to standalone activities
  creatorId: string;
  user: User;
}): EnrollmentType[] {
  if (user.isAdmin) {
    return allEnrollmentTypes;
  } else if (creatorId === user.id) {
    return allEnrollmentTypes;
  } else {
    return standaloneEnrollmentTypes;
  }
}

export async function getActivity({
  user,
  activityId,
  assertAccess,
}: {
  user: User;
  activityId: string;
  assertAccess: true;
}) {
  // this is just to call out what exactly the function is responsible for
  noop(assertAccess);

  const activity = await db.query.activities.findFirst({
    where: eq(schema.activities.id, activityId),
    with: {
      integrationActivity: true,
      standaloneActivity: true,
    },
  });
  if (!activity) {
    throw new Error("Activity not found");
  }

  const { integrationActivity, standaloneActivity } = activity;

  if (integrationActivity) {
    const { course, assignment } = await getCourseAndAssignment({
      userId: user.id,
      integrationActivity,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { standaloneActivity, ...rest } = activity;
    return {
      ...rest,
      type: "integration" as const,
      course,
      assignment,
      integrationActivity, // infers as non-nullable
      enrolledAs: course.enrolledAs,
    };
  }

  if (standaloneActivity) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { integrationActivity, ...rest } = activity;
    const enrolledAs = getEnrolledAs({
      isStandaloneActivity: true,
      creatorId: standaloneActivity.creatorId,
      user,
    });

    await ensureAutoEnrollment({
      standaloneActivityId: standaloneActivity.id,
      userId: user.id,
    });

    return {
      ...rest,
      type: "standalone" as const,
      standaloneActivity, // infers as non-nullable
      enrolledAs,
    };
  }

  throw new Error("Could not determine activity type");
}

// we're sort of mushing together the standaloneActivity and integrationActivity
// into a single type, but it works for now (and at least it's represented
// in an explicit union type)
export type RichActivity = Awaited<ReturnType<typeof getActivity>>;

export async function assertActivityAccess({
  user,
  activityId,
}: {
  user: User;
  activityId: string;
}) {
  await getActivity({ user, activityId, assertAccess: true });
}

export async function getAllActivities({
  user,
}: {
  user: User;
}): Promise<RichActivity[]> {
  const result = Array<RichActivity>();
  const assignmentActivities = await getAssignmentActivities({
    userId: user.id,
  });
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

  const standaloneActivities = await db.query.standaloneActivities.findMany({
    where: eq(schema.standaloneActivities.creatorId, user.id),
    with: {
      activity: true,
    },
  });
  for (const standaloneActivity of standaloneActivities) {
    const enrolledAs = getEnrolledAs({
      isStandaloneActivity: true,
      creatorId: standaloneActivity.creatorId,
      user,
    });
    result.push({
      ...standaloneActivity.activity,
      type: "standalone" as const,
      standaloneActivity,
      enrolledAs,
    });
  }
  const ownedStandaloneActivityIds = standaloneActivities.map((s) => s.id);

  const standaloneEnrollments = await db.query.standaloneEnrollments.findMany({
    where: eq(schema.standaloneEnrollments.userId, user.id),
    with: {
      standaloneActivity: {
        with: {
          activity: true,
        },
      },
    },
  });
  for (const standaloneEnrollment of standaloneEnrollments) {
    const { standaloneActivity } = standaloneEnrollment;
    if (ownedStandaloneActivityIds.includes(standaloneActivity.id)) {
      continue;
    }
    result.push({
      ...standaloneActivity.activity,
      standaloneActivity,
      type: "standalone" as const,
      enrolledAs: standaloneEnrollmentTypes,
    });
  }

  return result;
}
