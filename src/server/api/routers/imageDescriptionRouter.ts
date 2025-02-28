import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getImageDescription } from "~/server/services/imageDescription/imageDescriptionService";

export const imageDescriptionRouter = createTRPCRouter({
  describe: protectedProcedure
    .input(z.object({ imageDataUrl: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { imageDataUrl } = input;
      const description = await getImageDescription({
        userId,
        imageDataUrl,
      });
      return description;
    }),
});
