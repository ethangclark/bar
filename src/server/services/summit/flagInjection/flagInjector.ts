import { createEmptyDescendents } from "~/common/descendentUtils";
import { getLlmResponse } from "~/server/ai/llm";
import { defaultModel } from "~/server/ai/llm/types";
import { db, schema } from "~/server/db";
import { publishDescendentUpserts } from "~/server/db/pubsub/descendentPubSub";
import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { notifyAdmin } from "../../email/notifyAdmin";
import { extractFlagReason } from "./extractFlagReason";

async function getFlag({
  userId,
  assistantResponse,
  prevMessages,
}: {
  userId: string;
  assistantResponse: Message;
  prevMessages: MessageWithDescendents[];
}) {
  const prompt = `
  You are analyzing a conversation between a student and a virtual learning assistant.
  
  Your task is to determine if the last message sent by the learning assistant denotes that a new flag should be added (or has been added) to the conversation.
  
  If the last message demonstrates that a new flag should be added, respond with:
  <flag-reason>reason</flag-reason>
  ...where "reason" is a description of the original issue -- the issue that led to an assessment that the conversation should be flagged.

  If the last message does not indicate that a new flag should be added, respond with:
  <no-flags></no-flags>
  
  The purpose of flags is to mark instances where there is a problem with the tutoring process itself. We determine this by looking for instances where the tutor acknowledges either an explicit request to flag the conversation, or acknowledges that the tutoring process itself has encountered a fundamental problem.

  It's normal for students to get confused about the content of the assignment, or the instructions. Don't flag instances of this sort of confusion being expressed; it's only issues they encounter that are related to the tutoring process itself that should be flagged, like issues with mistakes by the tutor, or issues with the tutoring platform that the student notices.

  Here are some examples of message that warrant a <flag-reason> response:

  Example message: "I'm sorry -- it sounds like I made a mistake; you're right that the Battle of Gettysburg was in 1863, not 1862. I'll flag this conversation. Let's move on to the next question."
  Example response: <flag-reason>The tutor referenced the wrong date in their description of the Battle of Gettysburg.</flag-reason>

  Example message: "My apologies -- it appears that I asked a question that was not part of the assignment. I'll flag this conversation."
  Example response: <flag-reason>The tutor asked a question taht was not part of the assignment.</flag-reason>

  Example message: "It looks like I included some unusual characters in my last response -- my apologies. Let me try that again..."
  Example response: <flag-reason>The tutor included some unusual characters in their last response.</flag-reason>

  Here are some examples of messages that should NOT be flagged:
  
  Example message: "I'm having a hard time understanding your response. Can you please clarify?"
  Example response: <no-flags></no-flags>

  Example message: "It sounds like you're confused about the quadratic formula. Let's go over it again."
  Example response: <no-flags></no-flags>

  Example message: "Sorry for the confusion -- let me break that down in more detail."
  Example response: <no-flags></no-flags>

  Remember: You're only calling out if the *last message* indicates that a new flag should be added. If there are other flags mentioned earlier in the conversation, don't worry about those; just focus on the last message.
  
  Following are the actual messages from the conversation:

  BEGIN CONVERSATION

  ${[...prevMessages, assistantResponse].map((msg, idx) => `${idx === prevMessages.length ? "(BEGIN LAST MESSAGE)\n" : ""}${msg.senderRole}: ${msg.content}`).join("\n\n")}

  END CONVERSATION
  `;

  const llmResponse = await getLlmResponse(
    userId,
    {
      model: defaultModel,
      messages: [{ role: "user", content: prompt }],
    },
    db,
  );
  if (llmResponse instanceof Error) {
    void notifyAdmin("error determining flags or lack thereof (in prompt)", {
      prompt,
      llmResponse: {
        message: llmResponse.message,
        stack: llmResponse.stack,
      },
    });
    throw llmResponse;
  }
  try {
    // Use the LLM to analyze the conversation

    const flagReason = extractFlagReason({ llmResponse });

    return { flagReason };
  } catch (e) {
    void notifyAdmin("error determining flag or lack thereof (in parsing)", {
      prompt,
      llmResponse,
    });
    throw e;
  }
}

export async function injectFlags(
  assistantResponse: Message,
  prevMessages: MessageWithDescendents[],
) {
  const { userId } = assistantResponse;

  const { flagReason } = await getFlag({
    userId,
    assistantResponse,
    prevMessages,
  });

  if (flagReason === null) {
    return;
  }

  const newFlags = await db
    .insert(schema.flags)
    .values([
      {
        userId,
        activityId: assistantResponse.activityId,
        reason: flagReason,
        messageId: assistantResponse.id,
        threadId: assistantResponse.threadId,
      },
    ])
    .returning();

  const descendents = {
    ...createEmptyDescendents(),
    flags: newFlags,
  };
  await publishDescendentUpserts(descendents);
}
