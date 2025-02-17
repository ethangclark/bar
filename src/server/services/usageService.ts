import { eq, sql } from "drizzle-orm";
import { type DbOrTx } from "~/server/db";
import { users } from "~/server/db/schema";
import { getUser } from "./userService";

export async function determineIfUsageOk(userId: string, tx: DbOrTx) {
  const user = await getUser(userId, tx);
  if (user.llmTokensUsed > 100 * 1000 * 1000) {
    return new Error(
      "You have exceeded your allotted usage. Please contact support.",
    );
  }
  return null;
}

export async function assertUsageOk(userId: string, tx: DbOrTx) {
  const result = await determineIfUsageOk(userId, tx);
  if (result instanceof Error) {
    return result;
  }
  return null;
}

export async function incrementUsage(
  userId: string,
  llmTokensUsed: number,
  tx: DbOrTx,
) {
  const user = await getUser(userId, tx);
  await tx
    .update(users)
    .set({
      llmTokensUsed: sql`${users.llmTokensUsed} + ${llmTokensUsed}`,
    })
    .where(eq(users.id, user.id));
}
