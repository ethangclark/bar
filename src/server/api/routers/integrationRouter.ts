import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCanvasBaseUrl } from "~/common/utils/canvasUtils";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export const integrationRouter = createTRPCRouter({
  createCanvasIntegration: publicProcedure
    .input(
      z.object({
        subdomain: z.string(),
        clientId: z.string(),
        clientSecret: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { subdomain } = input;
      const canvasBaseUrl = getCanvasBaseUrl(subdomain);
      const existing = await db.query.canvasIntegrations.findFirst({
        where: eq(dbSchema.canvasIntegrations.canvasBaseUrl, canvasBaseUrl),
        with: { integration: true },
      });
      let integration = existing?.integration;
      if (existing?.validated) {
        throw new Error("Valid integration already exists");
      }
      await db
        .delete(dbSchema.canvasIntegrations)
        .where(eq(dbSchema.canvasIntegrations.canvasBaseUrl, canvasBaseUrl));
      if (!integration) {
        const [intResult] = await db
          .insert(dbSchema.integrations)
          .values({
            type: "canvas",
          })
          .returning();
        if (!intResult) {
          throw new Error("Failed to create integration");
        }
        integration = intResult;
      }

      await db.insert(dbSchema.canvasIntegrations).values({
        integrationId: integration.id,
        canvasBaseUrl,
        clientId: input.clientId,
        clientSecret: input.clientSecret,
      });
    }),
});
