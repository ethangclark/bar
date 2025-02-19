import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCanvasBaseUrl } from "~/common/canvasUtils";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db, schema } from "~/server/db";

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
      await db.transaction(async (tx) => {
        const existing = await tx.query.canvasIntegrations.findFirst({
          where: eq(schema.canvasIntegrations.canvasBaseUrl, canvasBaseUrl),
          with: { integration: true },
        });
        let integration = existing?.integration;
        if (existing?.validated) {
          throw new Error("Valid integration already exists");
        }
        await tx
          .delete(schema.canvasIntegrations)
          .where(eq(schema.canvasIntegrations.canvasBaseUrl, canvasBaseUrl));
        if (!integration) {
          const [intResult] = await tx
            .insert(schema.integrations)
            .values({
              type: "canvas",
            })
            .returning();
          if (!intResult) {
            throw new Error("Failed to create integration");
          }
          integration = intResult;
        }

        await tx.insert(schema.canvasIntegrations).values({
          integrationId: integration.id,
          canvasBaseUrl,
          clientId: input.clientId,
          clientSecret: input.clientSecret,
        });
      });
    }),
});
