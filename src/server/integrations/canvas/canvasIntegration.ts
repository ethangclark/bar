import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assertOne } from "~/common/arrayUtils";
import { db, schema } from "~/server/db";
import { type Integration } from "~/server/db/schema";
import { type IntegrationApi, type LmsCourse } from "../types";
import {
  type CanvasCourse,
  getCanvasAssignments,
  getCanvasCourse,
  getCanvasCourses,
} from "./canvasApiService";

async function getOneCanvasCourse({
  userId,
  exCourseIdJson,
}: {
  userId: string;
  exCourseIdJson: string;
}) {
  const canvasUsers = await db.query.canvasUsers.findMany({
    where: eq(schema.canvasUsers.userId, userId),
  });
  const canvasIntegrationIds = canvasUsers.map((cu) => cu.canvasIntegrationId);
  const canvasCourseId = z.number().parse(JSON.parse(exCourseIdJson));
  const courses = await Promise.all(
    canvasIntegrationIds.map(async (canvasIntegrationId) =>
      getCanvasCourse({ userId, canvasIntegrationId, canvasCourseId, tx: db }),
    ),
  );
  const course = assertOne(courses);
  return course;
}

async function getAllCanvasCourses(userId: string) {
  const canvasUsers = await db.query.canvasUsers.findMany({
    where: eq(schema.canvasUsers.userId, userId),
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

async function createIntegrationActivities({
  exAssignmentIdJsons,
  exCourseIdJson,
  integrationId,
}: {
  exAssignmentIdJsons: string[];
  exCourseIdJson: string;
  integrationId: string;
}) {
  // so drizzle doesn't complain
  if (exAssignmentIdJsons.length === 0) return [];

  return await db.transaction(async (tx) => {
    const newActivities = await tx
      .insert(schema.activities)
      .values(exAssignmentIdJsons.map(() => ({})))
      .returning();
    const nias = await tx
      .insert(schema.integrationActivities)
      .values(
        exAssignmentIdJsons.map((iaij, index) => {
          const newActivity = newActivities[index];
          if (!newActivity) throw new Error("No activity found");
          return {
            exCourseIdJson,
            exAssignmentIdJson: iaij,
            integrationId,
            activityId: newActivity.id,
          };
        }),
      )
      .returning();
    return nias.map((nia) => {
      const activity = newActivities.find((a) => a.id === nia.activityId);
      if (!activity) throw new Error("Activity not found");
      return {
        ...nia,
        activity,
      };
    });
  });
}

async function createFullIntegrationActivityMap({
  exAssignmentIdJsons,
  exCourseIdJson,
  integrationId,
}: {
  exAssignmentIdJsons: string[];
  exCourseIdJson: string;
  integrationId: string;
}) {
  const integrationActivities = await db.query.integrationActivities.findMany({
    where: inArray(
      schema.integrationActivities.exAssignmentIdJson,
      exAssignmentIdJsons,
    ),
    with: {
      activity: true,
    },
  });

  const integrationActivityMap = new Map(
    integrationActivities.map((ia) => [ia.exAssignmentIdJson, ia] as const),
  );

  const missingJsons = exAssignmentIdJsons.filter(
    (eij) => !integrationActivityMap.has(eij),
  );
  const newIntegrationActivities = await createIntegrationActivities({
    exAssignmentIdJsons: missingJsons,
    exCourseIdJson,
    integrationId,
  });
  for (const ia of newIntegrationActivities) {
    integrationActivityMap.set(ia.exAssignmentIdJson, ia);
  }

  return integrationActivityMap;
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
  const exCourseIdJson = JSON.stringify(canvasCourse.id);
  const rawAssignments = await getCanvasAssignments({
    userId,
    canvasIntegrationId,
    canvasCourseId: canvasCourse.id,
  });
  const exAssignmentIdJsons = rawAssignments.map((a) => JSON.stringify(a.id));

  const integrationActivityMap = await createFullIntegrationActivityMap({
    exAssignmentIdJsons,
    exCourseIdJson,
    integrationId,
  });

  const lmsCourse: LmsCourse = {
    title: canvasCourse.name,
    enrolledAs: canvasCourse.enrollments.map((e) => e.enrolledAs),
    assignments: rawAssignments.map((a) => {
      const integrationActivity = integrationActivityMap.get(
        JSON.stringify(a.id),
      );
      if (!integrationActivity)
        throw new Error("Integration activity not found");
      return {
        exAssignmentIdJson: JSON.stringify(a.id),
        dueAt: a.dueAt,
        lockedAt: a.lockedAt,
        title: a.name,
        integrationActivity,
        activity: integrationActivity.activity,
      };
    }),
  };
  return lmsCourse;
}

export async function createCanvasIntegrationApi(
  integration: Integration,
): Promise<IntegrationApi> {
  const cis = await db.query.canvasIntegrations.findMany({
    where: eq(schema.canvasIntegrations.integrationId, integration.id),
  });
  const canvasIntegration = assertOne(cis);

  const markValidated = () =>
    db
      .update(schema.canvasIntegrations)
      .set({ validated: true })
      .where(eq(schema.canvasIntegrations.id, canvasIntegration.id));

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
