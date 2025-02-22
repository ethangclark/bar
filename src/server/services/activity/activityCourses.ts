import { eq } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { db, schema } from "~/server/db";
import { type LmsAssignment } from "~/server/integrations/types";
import {
  apiFromIntegration,
  getIntegrationApi,
} from "~/server/services/integrationService";
import { type IntegrationActivity } from "../../db/schema";

export async function getCourseAndAssignment({
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
  for (const courseAssignment of course.assignments) {
    if (
      courseAssignment.integrationActivity.activityId !==
      integrationActivity.activityId
    ) {
      continue;
    }
    if (isDeveloper(course.enrolledAs)) {
      assignment = courseAssignment;
    }
    switch (courseAssignment.activity.status) {
      case "published":
        assignment = courseAssignment;
      case "draft":
        // do nothing;
        continue;
    }
    assertTypesExhausted(courseAssignment.activity.status);
  }
  if (!course || !assignment) {
    throw new Error("Activity not found");
  }

  return { course, assignment };
}

export async function getAssignmentActivities({ userId }: { userId: string }) {
  const userIntegrations = await db.query.userIntegrations.findMany({
    where: eq(schema.userIntegrations.userId, userId),
    with: {
      integration: {
        with: {
          integrationActivities: {
            with: {
              activity: true,
            },
          },
        },
      },
    },
  });
  const integrations = userIntegrations.map((ui) => ui.integration);
  const activitiesRaw = await Promise.all(
    integrations.map(async (integration) => {
      const integrationApi = await apiFromIntegration(integration);
      const courses = await integrationApi.getCourses({ userId });
      return courses.map((course) =>
        course.assignments.map((assignment) => ({
          activity: assignment.activity,
          integrationActivity: assignment.integrationActivity,
          course,
          assignment,
        })),
      );
    }),
  );
  const activities = activitiesRaw.flat(2);
  return activities;
}
