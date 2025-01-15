import { type Session } from "next-auth";
import { z } from "zod";
import {
  canvasBaseUrl,
  clientId,
  clientSecret,
  redirectUri,
} from "~/common/utils/canvasUtils";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
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
  processCanvasCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { code } = input;

      const params = new URLSearchParams();
      params.append("code", code);
      params.append("grant_type", "authorization_code");
      params.append("client_id", clientId);
      params.append("client_secret", clientSecret);
      params.append("redirect_uri", redirectUri);
      const result = await fetch(
        `${canvasBaseUrl}/login/oauth2/token?${params.toString()}`,
        {
          method: "POST",
        },
      );
      try {
        const asJson = await result.json();

        // not currenlty using commented-out fields
        const typed = z
          .object({
            access_token: z.string(),
            // canvas_region: z.string(),
            expires_in: z.number(), // time in seconds
            refresh_token: z.string(),
            // token_type: z.literal("Bearer"),
            // user: z.object({
            //   id: z.number(),
            //   name: z.string(),
            //   global_id: z.string(),
            //   // effective_locale: z.string(),
            // }),
          })
          .parse(asJson);
        console.log({ userId: ctx.userId, typed });
      } catch (e) {
        const text = await result.text();
        console.log({ text });
        console.error(e);
      }
    }),
});
