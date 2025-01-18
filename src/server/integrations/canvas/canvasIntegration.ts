import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { type Integration } from "~/server/db/schema";
import { type IntegrationApi } from "../utils/integrationApi";
import { getCanvasCourses } from "./canvasApiService";

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
      const canvasUsers = await db.query.canvasUsers.findMany({
        where: eq(dbSchema.canvasUsers.userId, userId),
      });
      const canvasIntegrationIds = canvasUsers.map(
        (cu) => cu.canvasIntegrationId,
      );
      const courseLists = await Promise.all(
        canvasIntegrationIds.map(async (canvasIntegrationId) =>
          getCanvasCourses({ userId, canvasIntegrationId }),
        ),
      );
      console.log({ courseLists });
      return [];
    },
    setGrading: () => Promise.resolve(),
    submitScore: () => Promise.resolve(),
  };
}
