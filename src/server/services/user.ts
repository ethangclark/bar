import { type DbOrTx } from "~/server/db";
import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";
import { env } from "~/env";

export const queryUser = async (userId: string, tx: DbOrTx) => {
  return await tx.query.users.findFirst({
    where: eq(users.id, userId),
  });
};

export const getUser = async (userId: string, tx: DbOrTx) => {
  const user = await queryUser(userId, tx);
  if (!user) throw new Error("User not found");
  return user;
};

export const getCtxTimeoutMs = async (_: { testContextId: number }) => {
  const defaultTimeoutMs = env.NODE_ENV === "production" ? 20000 : 5000; // 20 seconds, else 5 seconds
  return defaultTimeoutMs; // we can make this configurable if/when necessary
};
