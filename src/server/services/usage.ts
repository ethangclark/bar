import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { failure, isFailure } from "~/common/utils/result";
import { getUser } from "./user";

export async function determineIfUsageOk(userId: string) {
  const user = await getUser(userId);
  if (user.tokensUsed > 10 * 1000 * 1000) {
    return failure(
      "You have exceeded your allotted usage. Please contact support.",
    );
  }
  return null;
}

export async function assertUsageOk(userId: string) {
  const result = await determineIfUsageOk(userId);

  if (isFailure(result)) {
    throw Error(result.problem);
  }

  return result;
}

export async function incrementUsage(userId: string, tokensUsed: number) {
  const user = await getUser(userId);
  await db
    .update(users)
    .set({
      tokensUsed: sql`${users.tokensUsed} + ${tokensUsed}`,
    })
    .where(eq(users.id, user.id))
    .execute();
}
