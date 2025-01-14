import { type Session } from "next-auth";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
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
  processCanvasCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { code } = input;
      // const result = await fetch('http')
      console.log({ code, userId: ctx.userId });
    }),
});
