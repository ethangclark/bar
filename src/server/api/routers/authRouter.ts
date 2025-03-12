import { z } from "zod";
import { type UserBasic } from "~/common/types";
import {
  createTRPCRouter,
  type Ctx,
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

function getBasicSessionDeets(ctx: Ctx) {
  const loggedIn = isLoggedIn(ctx);
  const isAdmin = ctx.user?.email === "ethangclark@gmail.com";
  const email = ctx.user?.email ?? null;
  const name = ctx.user?.name ?? null;
  const userId = ctx.user?.id ?? null;
  const user: UserBasic | null = userId ? { id: userId, email, name } : null;
  return { isLoggedIn: loggedIn, user, isAdmin };
}

export const authRouter = createTRPCRouter({
  basicSessionDeets: publicProcedure.query(async ({ ctx }) => {
    return getBasicSessionDeets(ctx);
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
      return getBasicSessionDeets(ctx);
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
      return { succeeded, ...getBasicSessionDeets(ctx) };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const { session } = ctx;
    await logoutUser(session, db);
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
