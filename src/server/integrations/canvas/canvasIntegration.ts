import { eq, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import { type Integration } from "~/server/db/schema";
import { type LmsCourse, type IntegrationApi } from "../types";
import {
  type CanvasCourse,
  getCanvasAssignments,
  getCanvasCourse,
  getCanvasCourses,
} from "./canvasApiService";
import { z } from "zod";

async function getOneCanvasCourse({
  userId,
  exCourseIdJson,
}: {
  userId: string;
  exCourseIdJson: string;
}) {
  const canvasUsers = await db.query.canvasUsers.findMany({
    where: eq(db.x.canvasUsers.userId, userId),
  });
  const canvasIntegrationIds = canvasUsers.map((cu) => cu.canvasIntegrationId);
  const canvasCourseId = z.number().parse(JSON.parse(exCourseIdJson));
  const courses = await Promise.all(
    canvasIntegrationIds.map(async (canvasIntegrationId) =>
      getCanvasCourse({ userId, canvasIntegrationId, canvasCourseId, tx: db }),
    ),
  );
  const [course, ...excess] = courses;
  if (!course) {
    throw new Error("Course not found");
  }
  if (excess.length > 0) {
    throw new Error("More than one course found for course id");
  }
  return course;
}

async function getAllCanvasCourses(userId: string) {
  const canvasUsers = await db.query.canvasUsers.findMany({
    where: eq(db.x.canvasUsers.userId, userId),
  });
  const canvasIntegrationIds = canvasUsers.map((cu) => cu.canvasIntegrationId);
  const courseLists = await Promise.all(
    canvasIntegrationIds.map(async (canvasIntegrationId) =>
      getCanvasCourses({ userId, canvasIntegrationId, tx: db }),
    ),
  );
  const courses = courseLists.flat(1);
  return courses;
}

async function courseToLmsCourse({
  userId,
  canvasCourse,
  canvasIntegrationId,
  integrationId,
}: {
  userId: string;
  canvasCourse: CanvasCourse;
  canvasIntegrationId: string;
  integrationId: string;
}) {
  const rawAssignments = await getCanvasAssignments({
    userId,
    canvasIntegrationId,
    canvasCourseId: canvasCourse.id,
    tx: db,
  });
  const exAssignmentIdJsons = rawAssignments.map((a) => JSON.stringify(a.id));
  const activites = await db.query.activities.findMany({
    where: inArray(db.x.activities.exAssignmentIdJson, exAssignmentIdJsons),
  });
  const activityMap = new Map(
    activites.map((a) => [a.exAssignmentIdJson, a] as const),
  );
  const missingActivitiesexAssignmentIdJsons = exAssignmentIdJsons.filter(
    (eij) => !activityMap.has(eij),
  );
  const exCourseIdJson = JSON.stringify(canvasCourse.id);
  if (missingActivitiesexAssignmentIdJsons.length > 0) {
    // create an activity for each missing assignment that doesn't have an associated one
    const newActivities = await db
      .insert(db.x.activities)
      .values(
        missingActivitiesexAssignmentIdJsons.map((exAssignmentIdJson) => ({
          exCourseIdJson,
          exAssignmentIdJson,
          integrationId,
        })),
      )
      .returning();
    for (const a of newActivities) {
      activityMap.set(a.exAssignmentIdJson, a);
    }
  }

  const lmsCourse: LmsCourse = {
    title: canvasCourse.name,
    enrolledAs: canvasCourse.enrollments.map((e) => e.enrolledAs),
    assignments: rawAssignments.map((a) => {
      const activity = activityMap.get(JSON.stringify(a.id));
      if (!activity) {
        throw new Error("Activity not found");
      }
      return {
        exAssignmentIdJson: JSON.stringify(a.id),
        dueAt: a.dueAt,
        lockedAt: a.lockedAt,
        title: a.name,
        activity,
      };
    }),
  };
  return lmsCourse;
}

export async function createCanvasIntegrationApi(
  integration: Integration,
): Promise<IntegrationApi> {
  const [canvasIntegration, ...excess] =
    await db.query.canvasIntegrations.findMany({
      where: eq(db.x.canvasIntegrations.integrationId, integration.id),
    });
  if (excess.length > 0) {
    throw new Error("More than one canvas integration found for integration");
  }
  if (!canvasIntegration) {
    throw new Error("Canvas integration not found");
  }

  const markValidated = () =>
    db
      .update(db.x.canvasIntegrations)
      .set({ validated: true })
      .where(eq(db.x.canvasIntegrations.id, canvasIntegration.id));

  return {
    type: "canvas",
    integration,
    getCourse: async ({ userId, exCourseIdJson }) => {
      const canvasCourse = await getOneCanvasCourse({
        userId,
        exCourseIdJson,
      });
      const course = await courseToLmsCourse({
        userId,
        canvasCourse,
        canvasIntegrationId: canvasIntegration.id,
        integrationId: integration.id,
      });
      await markValidated();
      return course;
    },
    getCourses: async ({ userId }) => {
      const canvasCourses = await getAllCanvasCourses(userId);
      const result = await Promise.all(
        canvasCourses.map((canvasCourse) =>
          courseToLmsCourse({
            userId,
            canvasCourse,
            canvasIntegrationId: canvasIntegration.id,
            integrationId: integration.id,
          }),
        ),
      );
      await markValidated();
      return result;
    },
    setGrading: () => Promise.resolve(),
    submitScore: () => Promise.resolve(),
  };
}
