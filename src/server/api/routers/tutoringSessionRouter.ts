import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getOpenRouterResponse } from "~/server/ai/llm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import {
  chatMessageSchema,
  topicContextSchema,
  type TopicContext,
} from "~/server/db/schema";

const getSystemPrompt = (tc: TopicContext) => {
  return `You are conducting an informal bar exam prep tutoring session. This session is focused on the topic of "${tc.topic.name}", which the student is studying as part of the chapter "${tc.unit.name}: ${tc.module.name}".

The goal of the tutoring session is to efficiently and informally get the student to demonstrate topic mastery sufficient for bar exam preparation.

Before engaging in the session, generate an approach you will take to quickly 1) assess the student's current level in the area and 2) guide them to a level of understanding that will allow them to succeed on the bar exam. (If level 1 reveals that they are already at the necessary level, you will skip step 2.)

Ensure that your approach ruthlessly ignores details that will not directly contribute to the student's success on the bar exam. Focus on mastery of the core bar exam material, and breeze through the rest.`;
};
console.log(getSystemPrompt);

async function getChatMessages({
  userId,
  tutoringSessionId,
}: {
  userId: string;
  tutoringSessionId: string;
}) {
  const rawMessages = await db.query.chatMessages.findMany({
    where: and(
      eq(dbSchema.chatMessages.userId, userId),
      eq(dbSchema.chatMessages.tutoringSessionId, tutoringSessionId),
    ),
  });
  const messages = rawMessages.map((m) => chatMessageSchema.parse(m));
  const sorted = messages.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  return sorted;
}

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
  createTutoringSession: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        topicContext: topicContextSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { enrollmentId, topicContext } = input;
      const [session, ...excess] = await db
        .insert(dbSchema.tutoringSessions)
        .values({
          enrollmentId,
          topicId: topicContext.topic.id,
          userId: ctx.userId,
        })
        .returning();
      if (!session || excess.length > 0) {
        throw new Error("Failed to create tutoring session");
      }
      await db.insert(dbSchema.chatMessages).values([
        {
          tutoringSessionId: session.id,
          userId: ctx.userId,
          senderRole: "system",
          content: getSystemPrompt(topicContext),
        },
      ]);
      return session;
    }),
  chatMessages: protectedProcedure
    .input(z.object({ tutoringSessionId: z.string().nullable() }))
    .query(async ({ ctx, input }) => {
      const { tutoringSessionId } = input;
      if (tutoringSessionId == null) {
        return [];
      }
      const messages = getChatMessages({
        userId: ctx.userId,
        tutoringSessionId,
      });
      return messages;
    }),

  processUserMessage: protectedProcedure
    .input(z.object({ tutoringSessionId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { content, tutoringSessionId } = input;
      const messages = await getChatMessages({
        userId: ctx.userId,
        tutoringSessionId,
      });

      const response = await getOpenRouterResponse(ctx.userId, {
        model: "anthropic/claude-3.5-sonnet:beta",
        messages: [
          ...messages.map((m) => ({
            role: m.senderRole,
            content: m.content,
          })),
          {
            role: "user",
            content,
          },
        ],
      });
      const responseContent = response.choices[0]?.message.content;
      if (!responseContent) {
        throw new Error("No content in response");
      }
      console.log("responseContent", responseContent);
      return responseContent;
    }),
});