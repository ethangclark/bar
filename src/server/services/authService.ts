import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { type Session, users } from "~/server/db/schema";

export async function getLoginInfo(userId: string, session: Session | null) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      userIntegrations: true,
    },
  });

  const loggedInViaSession = !!session;
  const loggedInViaIntegration = (user?.userIntegrations.length ?? 0) > 0;

  const isLoggedIn = loggedInViaSession || loggedInViaIntegration;

  return {
    user,
    isLoggedIn,
  };
}

export async function isLoggedIn(userId: string, session: Session | null) {
  const { isLoggedIn } = await getLoginInfo(userId, session);
  return isLoggedIn;
}
