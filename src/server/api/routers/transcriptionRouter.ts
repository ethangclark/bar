import { and, eq } from "drizzle-orm";
import { audioDataSchema } from "~/common/utils/types";
import { transcribeAudio } from "~/server/ai/stt";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const transcriptionRouter = createTRPCRouter({
  transcribe: protectedProcedure
    .input(audioDataSchema)
    .mutation(async ({ input }) => {
      // TODO: convert to token equivalent
      const result = await transcribeAudio(input);
      return result;
    }),
});
