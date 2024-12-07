import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertIsNotFailure } from "~/common/utils/result";
import { getOpenRouterResponse } from "~/server/ai/llm";
import { getResponseText } from "~/server/ai/llm/responseText";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import {
  chatMessageSchema,
  topicContextSchema,
  type TopicContext,
} from "~/server/db/schema";

const getInitialSystemPrompt = (
  tc: TopicContext,
  prevConclusion: string | null,
) => {
  return `You are conducting an informal bar exam prep tutoring session. This session is focused on the topic of "${tc.topic.name}", which the student is studying as part of the chapter "${tc.unit.name}: ${tc.module.name}".

The goal of the tutoring session is to efficiently and informally get the student to demonstrate topic proficiency sufficient for bar exam preparation.

Before engaging in the session, generate an approach you will take to quickly 1) assess the student's current level in the area and 2) guide them to a level of understanding that will allow them to succeed on the bar exam. (If level 1 reveals that they are already at the necessary level, you will skip step 2.)
${prevConclusion ? `\nThe previous session concluded with the following notes:\n\n"""\n${prevConclusion}\n"""\n` : ""}
Ensure that your approach ruthlessly ignores details that will not directly contribute to the student's success on the bar exam. Focus on proficiency of the core bar exam material, and breeze through the rest.`;
};

const masteryDemonstratedCode = "PROFICIENCY_DEMONSTRATED";

const getHandoffPrompt = (_: TopicContext) => {
  return `Thank you for creating that.

I will be handing you over to the student in a moment. Something very important to remember: When you have reached a point in the session where the student has demonstrated sufficient proficiency in the topic, include the special code "${masteryDemonstratedCode}" in your message. This will signal to the system that the student has demonstrated proficiency and that the session is complete. Make sure you send this code IMMEDIATELY when it comes across that they are confident in the topic. If they say they've got it down and are ready to move on, take their word for it and send the code.

We're not going for a perfect bar exam score -- we're going for confidence in a passing score. Keeping them in the session longer than necessary will constitute a failure of purpose. So be efficient; if they're ready to move on, send the code. When in doubt, just ask them if they're ready to move on and respect their response.

I am now handing you off to the student. Please say hi and take over the session. (Also the student doesn't know I'm here, so don't mention me unless I tell you otherwise.)`;
};

const model = "anthropic/claude-3.5-sonnet:beta";

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
        prevConclusion: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { enrollmentId, topicContext, prevConclusion } = input;
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
      const initialSystemPrompt = getInitialSystemPrompt(
        topicContext,
        prevConclusion,
      );
      const initialMessage = {
        role: "system" as const,
        content: initialSystemPrompt,
      };
      const initialResponse = await getOpenRouterResponse(ctx.userId, {
        model,
        messages: [initialMessage],
      });
      const initialResponseText = getResponseText(initialResponse);
      assertIsNotFailure(initialResponseText);

      const handoffSystemPrompt = getHandoffPrompt(topicContext);
      const handedOffResponse = await getOpenRouterResponse(ctx.userId, {
        model,
        messages: [
          initialMessage,
          {
            role: "assistant",
            content: initialResponseText,
          },
          {
            role: "system",
            content: handoffSystemPrompt,
          },
        ],
      });
      const handedOffResponseText = getResponseText(handedOffResponse);
      assertIsNotFailure(handedOffResponseText);
      await db.insert(dbSchema.chatMessages).values({
        tutoringSessionId: session.id,
        userId: ctx.userId,
        senderRole: "system",
        content: initialSystemPrompt,
      });
      await db.insert(dbSchema.chatMessages).values({
        tutoringSessionId: session.id,
        userId: ctx.userId,
        senderRole: "assistant",
        content: initialResponseText,
      });
      await db.insert(dbSchema.chatMessages).values({
        tutoringSessionId: session.id,
        userId: ctx.userId,
        senderRole: "system",
        content: handoffSystemPrompt,
      });
      await db.insert(dbSchema.chatMessages).values({
        tutoringSessionId: session.id,
        userId: ctx.userId,
        senderRole: "assistant",
        content: handedOffResponseText,
      });
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

  sendMessage: protectedProcedure
    .input(z.object({ tutoringSessionId: z.string(), content: z.string() }))
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{
        conclusion: string | null;
        masteryDemonstrated: boolean;
      }> => {
        const { content: userMsg, tutoringSessionId } = input;
        const ogMessages = await getChatMessages({
          userId: ctx.userId,
          tutoringSessionId,
        });

        const messagesWithUserMsg = [
          ...ogMessages.map((m) => ({
            role: m.senderRole,
            content: m.content,
          })),
          {
            role: "user" as const,
            content: userMsg,
          },
        ];
        const response = await getOpenRouterResponse(ctx.userId, {
          model,
          messages: messagesWithUserMsg,
        });
        const responseText = getResponseText(response);
        assertIsNotFailure(responseText);
        await db.insert(dbSchema.chatMessages).values({
          tutoringSessionId,
          userId: ctx.userId,
          senderRole: "user",
          content: userMsg,
        });
        if (responseText.includes(masteryDemonstratedCode)) {
          const conclusion =
            "The student has demonstrated proficiency. Please continue tutoring them on the topic as they request."; // this string also exists in topic.tsx
          await db
            .update(dbSchema.tutoringSessions)
            .set({
              conclusion,
              demonstratesMastery: true,
            })
            .where(
              and(
                eq(dbSchema.tutoringSessions.userId, ctx.userId),
                eq(dbSchema.tutoringSessions.id, tutoringSessionId),
              ),
            );

          return {
            conclusion,
            masteryDemonstrated: true,
          };
        }

        // console.log("TOKENS~~~~~~~~~~~~~", response.usage.total_tokens);
        if (response.usage.total_tokens > 5000) {
          const conclusionMessages = [
            ...messagesWithUserMsg,
            {
              role: "user" as const,
              content: `Sorry, before you respond: This tutoring session is about to run out of time/space. Reply with the notes you'll need to continue where we left off and I'll have them back to you in the new session.`,
            },
          ];
          const conclusionResponse = await getOpenRouterResponse(ctx.userId, {
            model,
            messages: conclusionMessages,
          });
          const conclusion = getResponseText(conclusionResponse);
          assertIsNotFailure(conclusion);
          await db
            .update(dbSchema.tutoringSessions)
            .set({ conclusion })
            .where(
              and(
                eq(dbSchema.tutoringSessions.userId, ctx.userId),
                eq(dbSchema.tutoringSessions.id, tutoringSessionId),
              ),
            );
          return { conclusion, masteryDemonstrated: false };
        }

        await db.insert(dbSchema.chatMessages).values({
          tutoringSessionId,
          userId: ctx.userId,
          senderRole: "assistant",
          content: responseText,
        });
        return { conclusion: null, masteryDemonstrated: false };
      },
    ),
});
