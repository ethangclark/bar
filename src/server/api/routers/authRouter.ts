import { type Session } from "next-auth";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { executeUserInitiation } from "~/server/integrations/canvas/canvasApiService";
import { getSeatsRemaining } from "~/server/services/seats";

const isLoggedIn = (session: Session | null) => session !== null;

export const authRouter = createTRPCRouter({
  isLoggedIn: publicProcedure.query(({ ctx }) => {
    return isLoggedIn(ctx.session);
  }),
  seatsRemaining: publicProcedure.query(async ({ ctx }) => {
    const seatsRemaining = await getSeatsRemaining();
    return { isLoggedIn: isLoggedIn(ctx.session), seatsRemaining };
  }),
  processCanvasCode: publicProcedure
    .input(z.object({ code: z.string(), canvasIntegrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { code, canvasIntegrationId } = input;

      await executeUserInitiation({
        userId,
        oauthCode: code,
        canvasIntegrationId,
      });
    }),
});
