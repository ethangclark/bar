import { audioDataSchema } from "~/common/utils/types";
import { transcribeAudio } from "~/server/ai/stt";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const transcriptionRouter = createTRPCRouter({
  transcribe: protectedProcedure
    .input(audioDataSchema)
    .mutation(async ({ input }) => {
      const perMinute = 160 * 1000; // same logic is in topic.tsx
      if (input.data.length > perMinute * 10) {
        throw new Error("Audio data exceeds max supported length");
      }
      // TODO: convert to token equivalent
      const result = await transcribeAudio(input);
      return result;
    }),
});
