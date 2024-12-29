import { type Session } from "next-auth";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getSeatsRemaining } from "~/server/services/seats";

const isLoggedIn = (session: Session | null) => session !== null;

export const authRouter = createTRPCRouter({
  isLoggedIn: publicProcedure.query(({ ctx }) => {
    return isLoggedIn(ctx.session);
  }),
  seatsRemaining: publicProcedure.query(async ({ ctx }) => {
    const seatsRemaining = await getSeatsRemaining();
    return { isLoggedIn: isLoggedIn(ctx.session), seatsRemaining };
  }),
});
