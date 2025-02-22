import { and, eq } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import { db, schema } from "~/server/db";
import { createCanvasIntegrationApi } from "~/server/integrations/canvas/canvasIntegration";
import { type IntegrationApi } from "~/server/integrations/types";
import { type Integration } from "../db/schema";

export async function getIntegration({
  userId,
  integrationId,
}: {
  userId: string;
  integrationId: string;
}) {
  const ui = await db.query.userIntegrations.findFirst({
    where: and(
      eq(schema.userIntegrations.userId, userId),
      eq(schema.userIntegrations.integrationId, integrationId),
    ),
    with: {
      integration: {
        with: {
          canvasIntegration: true,
        },
      },
    },
  });
  if (!ui) {
    throw new Error("Integration not found");
  }
  return ui.integration;
}

async function getIntegrations(userId: string) {
  const uis = await db.query.userIntegrations.findMany({
    where: eq(schema.userIntegrations.userId, userId),
    with: {
      integration: true,
    },
  });
  return uis.map((ui) => ui.integration);
}

export async function apiFromIntegration(integration: Integration) {
  switch (integration.type) {
    case "canvas": {
      return createCanvasIntegrationApi(integration);
    }
  }
  assertTypesExhausted(integration.type);
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
