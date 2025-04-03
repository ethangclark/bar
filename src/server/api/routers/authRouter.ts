import { eq } from "drizzle-orm";
import { z } from "zod";
import { loginTypeSchema } from "~/common/searchParams";
import { type UserBasic } from "~/common/types";
import {
  createTRPCRouter,
  type Ctx,
  isLoggedIn,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { executeUserInitiation } from "~/server/integrations/canvas/canvasApiService";
import {
  associateSessionWithUser,
  logoutUser,
  setPasswordAndLogIn,
} from "~/server/services/authService";
import { sendSetPasswordEmail } from "~/server/services/email/setPasswordEmail";
import { getOrCreateUser } from "~/server/services/userService";
import { hashPassword } from "~/server/utils";

function getBasicSessionDeets(ctx: Ctx) {
  const loggedIn = isLoggedIn(ctx);
  const { user } = ctx;

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

  return { isLoggedIn: loggedIn, user: userBasic };
}

export const authRouter = createTRPCRouter({
  basicSessionDeets: publicProcedure.query(async ({ ctx }) => {
    return getBasicSessionDeets(ctx);
  }),

  passwordOkOrSendReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        encodedRedirect: z.string().nullable(),
        loginType: loginTypeSchema.nullable(),
      }),
    )
    .mutation(
      async ({ input }): Promise<{ result: "passwordOk" | "sentReset" }> => {
        /*
        if (env.NODE_ENV !== "production" && env.QUICK_DEV_LOGIN) {
          if (!ctx.session) {
            throw new Error("No session found for quick-dev-login mode");
          }
          const { user } = await setPasswordAndLogIn({
            setPasswordToken,
            session: ctx.session,
            tx: db,
            loginType,
            password: "password",
          });
          return {
            isLoggedIn: true,
            user,
            isAdmin: user?.isAdmin ?? false,
          };
        }
        */
        const { email, encodedRedirect, loginType } = input;
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        const passwordOk = !!user?.passwordHash;
        if (passwordOk) {
          return { result: "passwordOk" };
        }
        await sendSetPasswordEmail({ email, encodedRedirect, loginType });
        return { result: "sentReset" };
      },
    ),

  setPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string(),
        loginType: loginTypeSchema.nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx;
      if (!session) throw new Error("No session found");
      const { token, password, loginType } = input;
      const { user } = await setPasswordAndLogIn({
        setPasswordToken: token,
        password,
        session,
        tx: db,
        loginType,
      });
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isInstructor: user.isInstructor,
        requestedInstructorAccess: user.requestedInstructorAccess,
        isAdmin: user.isAdmin,
      } satisfies UserBasic;
    }),

  sendSetPasswordEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        encodedRedirect: z.string(),
        loginType: loginTypeSchema.nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { email, encodedRedirect, loginType } = input;
      await sendSetPasswordEmail({
        email,
        encodedRedirect,
        loginType,
      });
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx;
      if (!session) throw new Error("Session not found");
      const { email, password } = input;
      const user = await getOrCreateUser({ email, tx: db });

      const hashedPassword = hashPassword({
        password,
        salt: user.passwordSalt,
      });
      if (hashedPassword !== user.passwordHash) {
        return {
          isLoggedIn: false,
          user: null,
          isAdmin: false,
        };
      }

      await associateSessionWithUser({
        sessionCookieValue: session.sessionCookieValue,
        userId: user.id,
        tx: db,
      });

      const deets: ReturnType<typeof getBasicSessionDeets> = {
        isLoggedIn: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isInstructor: user.isInstructor,
          requestedInstructorAccess: user.requestedInstructorAccess,
          isAdmin: user.isAdmin,
        },
      };
      return deets;
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const { session } = ctx;
    await logoutUser(session, db);
  }),

  processCanvasCode: protectedProcedure
    .input(z.object({ code: z.string(), canvasIntegrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { code, canvasIntegrationId } = input;

      await db.transaction(async (tx) => {
        await executeUserInitiation({
          user,
          oauthCode: code,
          canvasIntegrationId,
          tx,
        });
      });
    }),
});
