import { z } from "zod";
import { getOpenRouterResponse } from "~/server/ai/llm";
import { getResponseText } from "~/server/ai/llm/responseText";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { topicContextSchema, type TopicContext } from "~/server/db/schema";

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

export const masteryDemonstratedCode = "PROFICIENCY_DEMONSTRATED";

const getHandoffPrompt = (_: TopicContext) => {
  return `Thank you for creating that.

I will be handing you over to the student in a moment. Something very important to remember: When you have reached a point in the session where the student has demonstrated sufficient proficiency in the topic, include the special code "${masteryDemonstratedCode}" in your message. This will signal to the system that the student has demonstrated proficiency and that the session is complete. Make sure you send this code IMMEDIATELY when it comes across that they are confident in the topic. If they say they've got it down and are ready to move on, take their word for it and send the code.

We're not going for a perfect bar exam score -- we're going for confidence in a passing score. Keeping them in the session longer than necessary will constitute a failure of purpose. So be efficient; if they're ready to move on, send the code. When in doubt, just ask them if they're ready to move on and respect their response.

I am now handing you off to the student. Please say hi and take over the session. (Also the student doesn't know I'm here, so don't mention me unless I tell you otherwise.)`;
};

const model = "deepseek/deepseek-chat";

export const createSessionParamSchema = z.object({
  enrollmentId: z.string(),
  topicContext: topicContextSchema,
  prevConclusion: z.string().nullable(),
});
type CreateSessionParams = z.infer<typeof createSessionParamSchema>;

export async function createTutoringSession(
  { enrollmentId, topicContext, prevConclusion }: CreateSessionParams,
  userId: string,
) {
  const [session, ...excess] = await db
    .insert(dbSchema.tutoringSessions)
    .values({
      enrollmentId,
      topicId: topicContext.topic.id,
      userId,
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
  const initialResponse = await getOpenRouterResponse(userId, {
    model,
    messages: [initialMessage],
  });
  const initialResponseText = getResponseText(initialResponse);
  if (initialResponseText instanceof Error) {
    return initialResponseText;
  }

  const handoffSystemPrompt = getHandoffPrompt(topicContext);
  const handedOffResponse = await getOpenRouterResponse(userId, {
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
  if (handedOffResponseText instanceof Error) {
    return handedOffResponseText;
  }
  await db.insert(dbSchema.chatMessages).values({
    tutoringSessionId: session.id,
    userId: userId,
    senderRole: "system",
    content: initialSystemPrompt,
  });
  await db.insert(dbSchema.chatMessages).values({
    tutoringSessionId: session.id,
    userId: userId,
    senderRole: "assistant",
    content: initialResponseText,
  });
  await db.insert(dbSchema.chatMessages).values({
    tutoringSessionId: session.id,
    userId: userId,
    senderRole: "system",
    content: handoffSystemPrompt,
  });
  await db.insert(dbSchema.chatMessages).values({
    tutoringSessionId: session.id,
    userId: userId,
    senderRole: "assistant",
    content: handedOffResponseText,
  });
  return session;
}
