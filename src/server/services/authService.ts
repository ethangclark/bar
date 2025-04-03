import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import { type LoginType } from "~/common/searchParams";
import { type UserBasic } from "~/common/types";
import { db, schema, type DbOrTx } from "~/server/db";
import { type Session } from "../db/schema";
import { hashPassword, hashToken } from "../utils";

export async function associateSessionWithUser({
  sessionCookieValue,
  userId,
  tx,
}: {
  sessionCookieValue: string;
  userId: string;
  tx: DbOrTx;
}) {
  await tx
    .update(schema.sessions)
    .set({ userId })
    .where(eq(schema.sessions.sessionCookieValue, sessionCookieValue));
}

export async function setPasswordAndLogIn({
  setPasswordToken,
  session,
  tx,
  loginType,
  password,
}: {
  setPasswordToken: string;
  session: Session;
  tx: DbOrTx;
  loginType: LoginType | null;
  password: string;
}) {
  const setPasswordTokenHash = hashToken(setPasswordToken);

  // verify the login token
  const user = await tx.query.users.findFirst({
    where: eq(schema.users.setPasswordTokenHash, setPasswordTokenHash),
  });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

  const { email, passwordSalt } = user;

  const passwordHash = hashPassword({ password, salt: passwordSalt });

  await db
    .update(schema.users)
    .set({
      email,
      passwordHash,
      setPasswordTokenHash: null,
    })
    .where(eq(schema.users.id, user.id));

  await associateSessionWithUser({
    sessionCookieValue: session.sessionCookieValue,
    userId: user.id,
    tx,
  });

  switch (loginType) {
    case null:
      break;
    case "instructor": {
      if (user.isInstructor) {
        break;
      }
      await db
        .update(schema.users)
        .set({
          requestedInstructorAccess: true,

          // COMMENT_004a
          // we may add some sort of approval process in the future,
          // but for now we'll just grant access to anyone who requests it
          // See COMMENT_004b
          isInstructor: true,
        })
        .where(eq(schema.users.id, user.id));

      user.requestedInstructorAccess = true;

      // COMMENT_004b
      // See COMMENT_004a
      user.isInstructor = true;
      break;
    }
    default:
      assertTypesExhausted(loginType);
  }

  return {
    user: {
      id: user.id,
      email,
      name: user.name,
      isInstructor: user.isInstructor,
      requestedInstructorAccess: user.requestedInstructorAccess,
      isAdmin: user.isAdmin,
    } satisfies UserBasic,
  };
}

export async function logoutUser(session: Session, tx: DbOrTx) {
  await tx
    .update(schema.sessions)
    .set({
      userId: null,
    })
    .where(eq(schema.sessions.sessionCookieValue, session.sessionCookieValue));
}
