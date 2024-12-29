import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { env } from "~/env";

export const queryUser = async (userId: string) => {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
};

export const getUser = async (userId: string) => {
  const user = await queryUser(userId);
  if (!user) throw new Error("User not found");
  return user;
};

export const getCtxTimeoutMs = async (_: { testContextId: number }) => {
  const defaultTimeoutMs = env.NODE_ENV === "production" ? 20000 : 5000; // 20 seconds, else 5 seconds
  return defaultTimeoutMs; // we can make this configurable if/when necessary
};
