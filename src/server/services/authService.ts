import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { assertOne } from "~/common/assertions";
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
) {
  const loginTokenHash = hashLoginToken(loginToken);
  const user = await tx.query.users.findFirst({
    where: eq(schema.users.loginTokenHash, loginTokenHash),
  });
  if (!user) return { succeeded: false };

  // if the login token was created after the session was created,
  // then we can login the user (because they're not an email scanner)
  if (user.loginTokenCreatedAt > session.createdAt) {
    await loginUser(loginToken, session, tx);
    return { succeeded: true };
  } else {
    return { succeeded: false };
  }
}

export async function loginUser(
  loginToken: string,
  session: Session,
  tx: DbOrTx,
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
}

export async function logoutUser(session: Session, tx: DbOrTx) {
  await tx
    .update(schema.sessions)
    .set({
      userId: null,
    })
    .where(eq(schema.sessions.sessionCookieValue, session.sessionCookieValue));
}
