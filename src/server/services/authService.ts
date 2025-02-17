import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { assertOne } from "~/common/arrayUtils";
import { db, DbOrTx } from "~/server/db";
import { Session } from "../db/schema";
import { hashLoginToken } from "../utils";

export async function getOrCreateVerifiedEmailUser({
  email,
  tx,
}: {
  email: string;
  tx: DbOrTx;
}) {
  const existingVerified = await tx.query.users.findFirst({
    where: eq(db.x.users.email, email),
  });
  if (existingVerified) {
    return existingVerified;
  }

  // clean up any existing unverified users with this email
  // (simpler than trying to reuse unverified users if they exist)
  await tx.delete(db.x.users).where(eq(db.x.users.unverifiedEmail, email));

  const users = await tx
    .insert(db.x.users)
    .values({ unverifiedEmail: email })
    .returning();
  return assertOne(users);
}

export async function loginUser(
  loginToken: string,
  session: Session,
  tx: DbOrTx,
) {
  const loginTokenHash = hashLoginToken(loginToken);

  // verify the login token
  const user = await tx.query.users.findFirst({
    where: eq(db.x.users.loginTokenHash, loginTokenHash),
  });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

  const email = user.email || user.unverifiedEmail;
  if (!email) {
    throw new Error("Could not identify user email");
  }

  // ensure email is noted as verified
  await db
    .update(db.x.users)
    .set({
      email,
      unverifiedEmail: null,
      loginTokenHash: null,
    })
    .where(eq(db.x.users.id, user.id));

  // associate the session with the user
  await db
    .update(db.x.sessions)
    .set({
      userId: user.id,
    })
    .where(eq(db.x.sessions.sessionCookieValue, session.sessionCookieValue));
}

export async function logoutUser(session: Session, tx: DbOrTx) {
  await tx
    .update(db.x.sessions)
    .set({
      userId: null,
    })
    .where(eq(db.x.sessions.sessionCookieValue, session.sessionCookieValue));
}
