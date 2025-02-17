import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { executeUserInitiation } from "~/server/integrations/canvas/canvasApiService";
import { sendLoginEmail } from "~/server/services/email/loginEmail";
import { hashLoginToken } from "~/server/utils";

export const authRouter = createTRPCRouter({
  sendLoginEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      await sendLoginEmail({ email });
    }),

  login: publicProcedure
    .input(z.object({ loginToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx;
      if (!session) throw new Error("Session not found");
      const { loginToken } = input;
      const loginTokenHash = hashLoginToken(loginToken);
      const user = await db.query.users.findFirst({
        where: eq(db.x.users.loginTokenHash, loginTokenHash),
      });
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (!user.unverifiedEmail) {
        throw new Error("Could not identify user email.");
      }
      const email = user.unverifiedEmail;
      await db
        .update(db.x.users)
        .set({
          email,
          unverifiedEmail: null,
          loginTokenHash: null,
        })
        .where(eq(db.x.users.id, user.id));
      await db
        .update(db.x.sessions)
        .set({
          userId: user.id,
        })
        .where(
          eq(db.x.sessions.sessionCookieValue, session.sessionCookieValue),
        );
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
