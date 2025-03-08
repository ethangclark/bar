import { z } from "zod";
import {
  createTRPCRouter,
  isLoggedIn,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { executeUserInitiation } from "~/server/integrations/canvas/canvasApiService";
import {
  attemptAutoLogin,
  loginUser,
  logoutUser,
} from "~/server/services/authService";
import { sendLoginEmail } from "~/server/services/email/loginEmail";

export const authRouter = createTRPCRouter({
  isLoggedIn: publicProcedure.query(async ({ ctx }) => {
    return isLoggedIn(ctx);
  }),

  sendLoginEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        encodedRedirect: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { email, encodedRedirect } = input;
      await sendLoginEmail({ email, encodedRedirect });
    }),

  login: publicProcedure
    .input(z.object({ loginToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx;
      if (!session) throw new Error("Session not found");
      const { loginToken } = input;
      await loginUser(loginToken, session, db);
    }),

  autoLogin: publicProcedure
    .input(z.object({ loginToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { loginToken } = input;
      const { session } = ctx;
      if (!session) {
        return { succeeded: false };
      }
      const { succeeded } = await attemptAutoLogin(loginToken, session, db);
      return { succeeded };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const { session } = ctx;
    await logoutUser(session, db);
  }),

  isAdmin: publicProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    if (!user) return false;
    return user.email === "ethangclark@gmail.com";
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
