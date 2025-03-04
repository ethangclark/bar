import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { assertOne } from "~/common/assertions";
import { env } from "~/env";
import { type DbOrTx } from "~/server/db";
import { users } from "~/server/db/schema";

export const queryUser = async (userId: string | null, tx: DbOrTx) => {
  if (userId === null) return null;
  return (
    (await tx.query.users.findFirst({
      where: eq(users.id, userId),
    })) ?? null
  );
};

export const createUser = async (tx: DbOrTx) => {
  const user = await tx
    .insert(users)
    .values({
      loginTokenCreatedAt: dayjs().add(1000, "year").toDate(),
    })
    .returning();
  return assertOne(user);
};

export const getOrCreateUser = async ({
  userId,
  tx,
}: {
  userId: string | null;
  tx: DbOrTx;
}) => {
  const user = await queryUser(userId, tx);
  if (user) return user;
  return createUser(tx);
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
