import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { createCanvasIntegrationApi } from "~/server/integrations/canvas/canvasIntegration";
import { type IntegrationApi } from "~/server/integrations/utils/integrationApi";
import { type Integration } from "../db/schema";
import { assertNever } from "~/common/utils/errorUtils";

export async function getIntegration({
  userId,
  integrationId,
}: {
  userId: string;
  integrationId: string;
}) {
  const ui = await db.query.userIntegrations.findFirst({
    where: and(
      eq(db.x.userIntegrations.userId, userId),
      eq(db.x.userIntegrations.integrationId, integrationId),
    ),
    with: {
      integration: {
        with: {
          canvasIntegrations: true,
        },
      },
    },
  });
  if (!ui) {
    throw new Error("Integration not found");
  }
  return ui.integration;
}

export async function getIntegrations(userId: string) {
  const uis = await db.query.userIntegrations.findMany({
    where: eq(db.x.userIntegrations.userId, userId),
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

async function apiFromIntegration(integration: Integration) {
  switch (integration.type) {
    case "canvas": {
      return createCanvasIntegrationApi(integration);
    }
  }
  assertNever(integration.type);
}

export async function getIntegrationApi({
  userId,
  integrationId,
}: {
  userId: string;
  integrationId: string;
}): Promise<IntegrationApi> {
  const integration = await getIntegration({ userId, integrationId });
  const integrationApi = await apiFromIntegration(integration);
  return integrationApi;
}

export async function getIntegrationApis(
  userId: string,
): Promise<IntegrationApi[]> {
  const integrations = await getIntegrations(userId);
  const integrationApis = await Promise.all(
    integrations.map((i) => apiFromIntegration(i)),
  );
  return integrationApis;
}
