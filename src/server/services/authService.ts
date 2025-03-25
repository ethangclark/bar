import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { assertOne, assertTypesExhausted } from "~/common/assertions";
import { type LoginType } from "~/common/searchParams";
import { type UserBasic } from "~/common/types";
import { db, schema, type DbOrTx } from "~/server/db";
import { type Session } from "../db/schema";
import { hashLoginToken } from "../utils";

export async function getOrCreateVerifiedEmailUser({
  email,
  tx,
}: {
  email: string;
  tx: DbOrTx;
}) {
  const existingVerified = await tx.query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  if (existingVerified) {
    return existingVerified;
  }

  // clean up any existing unverified users with this email
  // (simpler than trying to reuse unverified users if they exist)
  await tx.delete(schema.users).where(eq(schema.users.unverifiedEmail, email));

  const users = await tx
    .insert(schema.users)
    .values({
      unverifiedEmail: email,
      loginTokenCreatedAt: dayjs().add(1000, "year").toDate(),
    })
    .returning();
  return assertOne(users);
}

export async function attemptAutoLogin(
  loginToken: string,
  session: Session,
  tx: DbOrTx,
  loginType: LoginType | null,
): Promise<
  { succeeded: true; user: UserBasic } | { succeeded: false; user: null }
> {
  const loginTokenHash = hashLoginToken(loginToken);
  const user = await tx.query.users.findFirst({
    where: eq(schema.users.loginTokenHash, loginTokenHash),
  });
  if (!user) return { succeeded: false, user: null };

  // if the login token was created after the session was created,
  // then we can login the user (because they're not an email scanner)
  if (user.loginTokenCreatedAt > session.createdAt) {
    const { user } = await loginUser(loginToken, session, tx, loginType);
    return { succeeded: true, user };
  } else {
    return { succeeded: false, user: null };
  }
}

export async function loginUser(
  loginToken: string,
  session: Session,
  tx: DbOrTx,
  loginType: LoginType | null,
) {
  const loginTokenHash = hashLoginToken(loginToken);

  // verify the login token
  const user = await tx.query.users.findFirst({
    where: eq(schema.users.loginTokenHash, loginTokenHash),
  });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const email = user.email || user.unverifiedEmail;
  if (!email) {
    throw new Error("Could not identify user email");
  }

  // ensure email is noted as verified
  await db
    .update(schema.users)
    .set({
      email,
      unverifiedEmail: null,
      loginTokenHash: null,
    })
    .where(eq(schema.users.id, user.id));

  // associate the session with the user
  await db
    .update(schema.sessions)
    .set({
      userId: user.id,
    })
    .where(eq(schema.sessions.sessionCookieValue, session.sessionCookieValue));

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
