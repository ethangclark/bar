import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

export const understandingCriteriaRouter = createTRPCRouter({
  regenerateForTopic: adminProcedure
    .input(z.object({ topicId: z.string() }))
    .mutation(async ({ input }) => {
      console.log({ input });
      return {
        understandingCriteria: [],
      };
    }),
});
