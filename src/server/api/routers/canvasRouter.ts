import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCanvasBaseUrl } from "~/common/utils/canvasUtils";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const canvasRouter = createTRPCRouter({
  loginDeets: publicProcedure
    .input(z.object({ subdomain: z.string() }))
    .query(async ({ input }) => {
      const { subdomain } = input;
      const baseUrl = getCanvasBaseUrl(subdomain);
      const [canvasIntegration, ...excess] =
        await db.query.canvasIntegrations.findMany({
          where: eq(db.x.canvasIntegrations.canvasBaseUrl, baseUrl),
        });
      if (excess.length > 0) {
        throw new Error(
          "Multiple canvas integrations found for this subdomain",
        );
      }
      if (!canvasIntegration) {
        return null;
      }
      const { id: canvasIntegrationId, clientId } = canvasIntegration;
      return { canvasIntegrationId, clientId };
    }),
});
