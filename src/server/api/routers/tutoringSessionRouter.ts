import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getOpenRouterResponse } from "~/server/ai/llm";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { topicContextSchema, type TopicContext } from "~/server/db/schema";

const getPrompt = (tc: TopicContext) => {
  return `You are conducting an informal bar exam prep tutoring session. This session is focused on the topic of "${tc.topic.name}", which the student is studying as part of the chapter "${tc.unit.name}: ${tc.module.name}".

The goal of the tutoring session is to efficiently and informally get the student to demonstrate topic mastery sufficient for bar exam preparation.

Before engaging in the session, generate an approach you will take to quickly 1) assess the student's current level in the area and 2) guide them to a level of understanding that will allow them to succeed on the bar exam. (If level 1 reveals that they are already at the necessary level, you will skip step 2.)

Ensure that your approach ruthlessly ignores details that will not directly contribute to the student's success on the bar exam. Focus on mastery of the core bar exam material, and breeze through the rest.`;
};

export const tutoringSessionRouter = createTRPCRouter({
  enrollmentTutoringSessions: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { enrollmentId } = input;
      const tutoringSessions = await db.query.tutoringSessions.findMany({
        where: and(
          eq(dbSchema.tutoringSessions.enrollmentId, enrollmentId),
          eq(dbSchema.tutoringSessions.userId, ctx.session.user.id),
        ),
      });
      return tutoringSessions;
    }),
  regenerateForTopic: adminProcedure
    .input(topicContextSchema)
    .mutation(async ({ ctx, input }) => {
      const response = await getOpenRouterResponse(ctx.userId, {
        model: "anthropic/claude-3.5-sonnet:beta",
        messages: [
          {
            role: "system",
            content: getPrompt(input),
          },
        ],
      });
      const content = response.choices[0]?.message.content;
      if (!content) {
        throw new Error("No content in response");
      }
      console.log("content", content);
      return content;
    }),
});
