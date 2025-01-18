import { eq, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { type Integration } from "~/server/db/schema";
import { type LmsCourse, type IntegrationApi } from "../utils/integrationApi";
import { getCanvasAssignments, getCanvasCourses } from "./canvasApiService";
import { parseDateOrNull } from "~/common/utils/timeUtils";

async function getAllCanvasCourses(userId: string) {
  const canvasUsers = await db.query.canvasUsers.findMany({
    where: eq(dbSchema.canvasUsers.userId, userId),
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

export async function createCanvasIntegrationApi(
  integration: Integration,
): Promise<IntegrationApi> {
  const [canvasIntegration, ...excess] =
    await db.query.canvasIntegrations.findMany({
      where: eq(dbSchema.canvasIntegrations.integrationId, integration.id),
    });
  if (excess.length > 0) {
    throw new Error("More than one canvas integration found for integration");
  }
  if (!canvasIntegration) {
    throw new Error("Canvas integration not found");
  }

  // TODO: update the `valid` field of the integraiton after first successful API call
  return {
    type: "canvas",
    getCourses: async ({ userId }) => {
      const rawCourses = await getAllCanvasCourses(userId);
      return Promise.all(
        rawCourses.map(async (c) => {
          const rawAssignments = await getCanvasAssignments({
            userId,
            canvasIntegrationId: canvasIntegration.id,
            canvasCourseId: c.id,
            tx: db,
          });
          const exIdJsons = rawAssignments.map((a) => JSON.stringify(a.id));
          const activites = await db.query.activities.findMany({
            where: inArray(dbSchema.activities.exIdJson, exIdJsons),
          });
          const activityMap = new Map(
            activites.map((a) => [a.exIdJson, a] as const),
          );

          const lmsCourse: LmsCourse = {
            title: c.name,
            assignments: rawAssignments.map((a) => ({
              exIdJson: JSON.stringify(a.id),
              dueAt: parseDateOrNull(a.dueAt),
              title: a.name,
              activity: activityMap.get(JSON.stringify(a.id)) ?? null,
            })),
          };
          return lmsCourse;
        }),
      );
    },
    setGrading: () => Promise.resolve(),
    submitScore: () => Promise.resolve(),
  };
}
