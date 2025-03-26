import { z } from "zod";
import { loginTypeSchema } from "~/common/searchParams";
import { type UserBasic } from "~/common/types";
import { env } from "~/env";
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
  const { user } = ctx;
  const isAdmin = user?.isAdmin ?? false;

  // important to pull just the fields we need so we don't expose any sensitive data
  const userBasic: UserBasic | null = user
    ? {
        id: user.id,
        email: user.email,
        name: user.name,
        isInstructor: user.isInstructor,
        requestedInstructorAccess: user.requestedInstructorAccess,
        isAdmin: user.isAdmin,
      }
    : null;

  return { isLoggedIn: loggedIn, user: userBasic, isAdmin };
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
        loginType: loginTypeSchema.nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, encodedRedirect, loginType } = input;
      const { loginToken } = await sendLoginEmail({
        email,
        encodedRedirect,
        loginType,
      });
      if (env.NODE_ENV !== "production" && env.QUICK_DEV_LOGIN) {
        if (!ctx.session) {
          throw new Error("No session found for quick-dev-login mode");
        }
        const { user } = await loginUser(
          loginToken,
          ctx.session,
          db,
          loginType,
        );
        return {
          isLoggedIn: true,
          user,
          isAdmin: user?.isAdmin ?? false,
        };
      }
      return getBasicSessionDeets(ctx);
    }),

  login: publicProcedure
    .input(
      z.object({
        loginToken: z.string(),
        loginType: loginTypeSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx;
      if (!session) throw new Error("Session not found");
      const { loginToken, loginType } = input;
      const { user } = await loginUser(
        loginToken,
        session,
        db,
        loginType ?? null,
      );

      const deets: ReturnType<typeof getBasicSessionDeets> = {
        isLoggedIn: true,
        user,
        isAdmin: user?.isAdmin ?? false,
      };
      return deets;
    }),

  autoLogin: publicProcedure
    .input(
      z.object({
        loginToken: z.string(),
        loginType: loginTypeSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }): ReturnType<typeof attemptAutoLogin> => {
      const { loginToken, loginType } = input;
      const { session } = ctx;
      if (!session) {
        return { succeeded: false as const, user: null };
      }
      const result = await attemptAutoLogin(
        loginToken,
        session,
        db,
        loginType ?? null,
      );
      return result;
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
