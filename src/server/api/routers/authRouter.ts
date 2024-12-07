import { isNotNull } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

async function getSeatsRemaining() {
  const allUsers = await db.query.users.findMany({
    where: isNotNull(dbSchema.users.email),
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
