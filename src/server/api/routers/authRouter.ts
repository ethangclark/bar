import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getSeatsRemaining } from "~/server/services/seats";

export const authRouter = createTRPCRouter({
  isLoggedIn: publicProcedure.query(({ ctx }) => {
    return ctx.session !== null;
  }),
  seatsRemaining: publicProcedure.query(async () => {
    return getSeatsRemaining();
  }),
});
