import { getOpenRouterResponse } from "~/server/ai/llm";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { topicContextSchema } from "~/server/db/schema";

export const understandingCriteriaRouter = createTRPCRouter({
  regenerateForTopic: adminProcedure
    .input(topicContextSchema)
    .mutation(async ({ input }) => {
      const response = await getOpenRouterResponse({
        model: "anthropic/claude-3.5-sonnet:beta",
        messages: [
          {
            role: "user",
            content: `I am creating a study course for the course "${input.courseType.name}". I'm currently building my curriculum around  "${input.unit.name}: ${input.module.name}" I want you to generate a list of criteria that could be used to prove understanding of the following topic: ${input.topic.name}.`,
          },
        ],
      });
      const content = response.choices[0]?.message.content;
      if (!content) {
        throw new Error("No content in response");
      }
      return content;
    }),
});
