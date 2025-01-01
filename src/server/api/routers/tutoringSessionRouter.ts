import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { type MessageStreamItem } from "~/common/schemas/messageStreamingSchemas";
import { getLlmResponse, streamLlmResponse } from "~/server/ai/llm";
import { type Role } from "~/server/ai/llm/llmSchemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { chatMessageSchema } from "~/server/db/schema";
import {
  createSessionParamSchema,
  createTutoringSession,
  masteryDemonstratedCode,
} from "~/server/services/tutoringSession";

const model = "deepseek/deepseek-chat";

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

async function processLlmResponse({
  response,
  tutoringSessionId,
  userId,
  userMsg,
  messagesWithUserMsg,
}: {
  response: string;
  tutoringSessionId: string;
  userId: string;
  userMsg: string;
  messagesWithUserMsg: Array<{ role: Role; content: string }>;
}) {
  await db
    .insert(dbSchema.chatMessages)
    .values({
      tutoringSessionId,
      userId,
      senderRole: "user",
      content: userMsg,
    })
    .returning();
  if (response.includes(masteryDemonstratedCode)) {
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
          eq(dbSchema.tutoringSessions.userId, userId),
          eq(dbSchema.tutoringSessions.id, tutoringSessionId),
        ),
      );

    return { conclusion, masteryDemonstrated: true };
  }

  // truncate the conversation if it's too long
  if (
    messagesWithUserMsg.map((m) => m.content).join("").length +
      response.length >
    50000
  ) {
    const conclusionMessages = [
      ...messagesWithUserMsg,
      {
        role: "user" as const,
        content: `Sorry, before you respond: This tutoring session is about to run out of time/space. Reply with the notes you'll need to continue where we left off and I'll have them back to you in the new session.`,
      },
    ];
    const conclusion = await getLlmResponse(userId, {
      model,
      messages: conclusionMessages,
    });
    if (conclusion instanceof Error) {
      throw conclusion;
    }
    await db
      .update(dbSchema.tutoringSessions)
      .set({ conclusion })
      .where(
        and(
          eq(dbSchema.tutoringSessions.userId, userId),
          eq(dbSchema.tutoringSessions.id, tutoringSessionId),
        ),
      );
    return { conclusion, masteryDemonstrated: false };
  }

  await db.insert(dbSchema.chatMessages).values({
    tutoringSessionId,
    userId,
    senderRole: "assistant",
    content: response,
  });
  return { conclusion: null, masteryDemonstrated: false };
}

export const tutoringSessionRouter = createTRPCRouter({
  createTutoringSession: protectedProcedure
    .input(createSessionParamSchema)
    .mutation(async ({ ctx, input }) => {
      const session = await createTutoringSession(input, ctx.userId);
      return session;
    }),
  chatMessages: protectedProcedure
    .input(z.object({ tutoringSessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { tutoringSessionId } = input;
      const messages = getChatMessages({
        userId: ctx.userId,
        tutoringSessionId,
      });
      return messages;
    }),

  sendMessage: protectedProcedure
    .input(z.object({ tutoringSessionId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { content: userMsg, tutoringSessionId } = input;
      const { userId } = ctx;
      const ogMessages = await getChatMessages({
        userId,
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

      const response = await getLlmResponse(ctx.userId, {
        model,
        messages: messagesWithUserMsg,
      });
      if (response instanceof Error) {
        throw response;
      }
      return processLlmResponse({
        response,
        tutoringSessionId,
        userId,
        userMsg,
        messagesWithUserMsg,
      });
    }),

  streamMessage: protectedProcedure
    .input(z.object({ tutoringSessionId: z.string(), content: z.string() }))
    .subscription(async function* subscription({
      ctx,
      input,
    }): AsyncGenerator<MessageStreamItem> {
      const { userId } = ctx;
      const { content: userMsg, tutoringSessionId } = input;
      const ogMessages = await getChatMessages({
        userId,
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
      const gen = streamLlmResponse(ctx.userId, {
        model,
        messages: messagesWithUserMsg,
      });
      let response = "";
      for await (const resp of gen) {
        if (typeof resp === "string") {
          response += resp;
          yield { done: false, delta: resp };
        }
      }
      const result = await processLlmResponse({
        response,
        tutoringSessionId,
        userId,
        userMsg,
        messagesWithUserMsg,
      });
      yield { done: true, ...result };
    }),
});
