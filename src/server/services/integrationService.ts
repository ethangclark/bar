import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { dbSchema } from "../db/dbSchema";
import { createCanvasIntegrationApi } from "~/server/integrations/canvas/canvasIntegration";
import { type IntegrationApi } from "~/server/integrations/utils/integrationApi";

async function getIntegrations(userId: string) {
  const uis = await db.query.userIntegrations.findMany({
    where: eq(dbSchema.userIntegrations.userId, userId),
    with: {
      integration: {
        with: {
          canvasIntegrations: true,
        },
      },
    },
  });
  return uis.map((ui) => ui.integration);
}

export async function getIntegrationApis(
  userId: string,
): Promise<IntegrationApi[]> {
  const integrations = await getIntegrations(userId);
  const integrationApis = await Promise.all(
    integrations.map(async (integration) => {
      switch (integration.type) {
        case "canvas": {
          const api = await createCanvasIntegrationApi(integration);
          return api;
        }
      }
    }),
  );
  return integrationApis;
}
