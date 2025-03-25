import { createEmptyDescendents } from "~/common/descendentUtils";
import { getLlmResponse } from "~/server/ai/llm";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { notifyAdmin } from "../email/notifyAdmin";
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
  // Prepare the prompt for the LLM
  const prompt = `
  You are analyzing a conversation to determine if the last message says that the conversation will be flagged -- and if so, the reason that a flag was warranted.

  If the last message does not say that the conversation will be flagged, respond with:
  <no-flags></no-flags>
  
  However, if the last message says that the conversation will be flagged, respond with:
  <flag-reason>reason</flag-reason>

  ...where reason is a description of why the conversation will be flagged. (It can be anywhere between one sentence and a paragraph -- use your judgement.)
  
  ${[...prevMessages, assistantResponse].map((msg, idx) => `${idx === prevMessages.length ? "(BEGIN LAST MESSAGE)\n" : ""}${msg.senderRole}: ${msg.content}`).join("\n\n")}
  `;

  const llmResponse = await getLlmResponse(
    userId,
    {
      model: "google/gemini-2.0-flash-001",
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
      },
    ])
    .returning();

  const descendents = {
    ...createEmptyDescendents(),
    flags: newFlags,
  };
  await descendentPubSub.publish(descendents);
}
