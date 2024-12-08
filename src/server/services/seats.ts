import { and, isNotNull, ne } from "drizzle-orm";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export async function getSeatsRemaining() {
  const allUsers = await db.query.users.findMany({
    where: and(
      isNotNull(dbSchema.users.email),
      ne(dbSchema.users.email, ""), // Ensures email is not an empty string
    ),
  });
  return Math.max(61 - allUsers.length - 999, 0);
}
