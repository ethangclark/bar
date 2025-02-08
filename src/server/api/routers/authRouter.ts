import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { executeUserInitiation } from "~/server/integrations/canvas/canvasApiService";
import { isLoggedIn } from "~/server/services/authService";
import { getSeatsRemaining } from "~/server/services/seatsService";
export const authRouter = createTRPCRouter({
  isLoggedIn: publicProcedure.query(({ ctx }) => {
    return isLoggedIn(ctx.userId, ctx.session);
  }),
  seatsRemaining: publicProcedure.query(async ({ ctx }) => {
    return {
      isLoggedIn: await isLoggedIn(ctx.userId, ctx.session),
      seatsRemaining: await getSeatsRemaining(),
    };
  }),
  processCanvasCode: publicProcedure
    .input(z.object({ code: z.string(), canvasIntegrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { code, canvasIntegrationId } = input;

      await db.transaction(async (tx) => {
        await executeUserInitiation({
          userId,
          oauthCode: code,
          canvasIntegrationId,
          tx,
        });
      });
    }),
});
