import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCanvasBaseUrl } from "~/common/utils/canvasUtils";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

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
          where: eq(db.x.canvasIntegrations.canvasBaseUrl, canvasBaseUrl),
          with: { integration: true },
        });
        let integration = existing?.integration;
        if (existing?.validated) {
          throw new Error("Valid integration already exists");
        }
        await tx
          .delete(db.x.canvasIntegrations)
          .where(eq(db.x.canvasIntegrations.canvasBaseUrl, canvasBaseUrl));
        if (!integration) {
          const [intResult] = await tx
            .insert(db.x.integrations)
            .values({
              type: "canvas",
            })
            .returning();
          if (!intResult) {
            throw new Error("Failed to create integration");
          }
          integration = intResult;
        }

        await tx.insert(db.x.canvasIntegrations).values({
          integrationId: integration.id,
          canvasBaseUrl,
          clientId: input.clientId,
          clientSecret: input.clientSecret,
        });
      });
    }),
});
