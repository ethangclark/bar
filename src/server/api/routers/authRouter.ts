import { and, isNotNull, ne } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

async function getSeatsRemaining() {
  const allUsers = await db.query.users.findMany({
    where: and(
      isNotNull(dbSchema.users.email),
      ne(dbSchema.users.email, ""), // Ensures email is not an empty string
    ),
  });
  return 61 - allUsers.length;
}

export const authRouter = createTRPCRouter({
  isLoggedIn: publicProcedure.query(({ ctx }) => {
    return ctx.session !== null;
  }),
  seatsRemaining: publicProcedure.query(async () => {
    return getSeatsRemaining();
  }),
});
