import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertOneOrNone } from "~/common/assertions";
import { getCanvasBaseUrl } from "~/common/canvasUtils";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db, schema } from "~/server/db";

export const canvasRouter = createTRPCRouter({
  loginDeets: publicProcedure
    .input(z.object({ subdomain: z.string() }))
    .query(async ({ input }) => {
      const { subdomain } = input;
      const baseUrl = getCanvasBaseUrl(subdomain);
      const cis = await db.query.canvasIntegrations.findMany({
        where: eq(schema.canvasIntegrations.canvasBaseUrl, baseUrl),
      });
      const canvasIntegration = assertOneOrNone(cis);
      if (!canvasIntegration) {
        return null;
      }
      const { id: canvasIntegrationId, clientId } = canvasIntegration;
      return { canvasIntegrationId, clientId };
    }),
});
