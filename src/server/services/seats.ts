import { and, isNotNull, ne } from "drizzle-orm";
import { db } from "~/server/db";

export async function getSeatsRemaining() {
  const allUsers = await db.query.users.findMany({
    where: and(
      isNotNull(db.x.users.email),
      ne(db.x.users.email, ""), // Ensures email is not an empty string
    ),
  });
  return Math.max(61 - allUsers.length, 0);
}
