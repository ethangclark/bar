// src/server/services/summit/completionInjection/completionInjector.ts
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { filter } from "~/common/fnUtils";
import {
  indexToItemNumber,
  itemNumberToIndex,
  sortByOrderFracIdx,
} from "~/common/indexUtils";
import { getLlmResponse } from "~/server/ai/llm";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { notifyAdmin } from "../email/notifyAdmin";

/**
 * Analyzes the assistant response to determine if any items have been completed
 * and creates the corresponding completion records in the database.
 */
export async function injectCompletions(
  assistantResponse: Message,
  prevMessages: MessageWithDescendents[],
): Promise<{ completedActivityThisTurn: boolean }> {
  const { userId, activityId } = assistantResponse;

  // Get existing item completions for this activity
  const existingCompletions = await db.query.completions.findMany({
    where: eq(schema.completions.activityId, activityId),
  });

  // Get all items for this activity
  let items = await db.query.items.findMany({
    where: eq(schema.items.activityId, activityId),
  });
  items = sortByOrderFracIdx(items);

  const incompleteItemNumbers = filter(
    items.map((item, idx) => {
      if (
        existingCompletions.some((completion) => completion.itemId === item.id)
      ) {
        return null;
      }
      return indexToItemNumber(idx);
    }),
    z.number(),
  );

  // Analyze the response to determine completed items
  const { completedItemNumbers } = await analyzeCompletions(
    userId,
    [...prevMessages, assistantResponse],
    incompleteItemNumbers,
  );

  if (completedItemNumbers.length === 0) {
    return { completedActivityThisTurn: false }; // No new completions
  }

  // Create new item completion records
  const newCompletions = completedItemNumbers.map((itemNumber) => {
    const itemIndex = itemNumberToIndex(itemNumber);
    const itemId = items[itemIndex]?.id;
    if (itemId === undefined) {
      throw new Error("Item not found: " + itemNumber);
    }
    return {
      id: crypto.randomUUID(),
      activityId,
      userId,
      messageId: assistantResponse.id,
      itemId,
    };
  });

  // Insert the new completions into the database
  const insertedCompletions = await db
    .insert(schema.completions)
    .values(newCompletions)
    .returning();

  // Publish the new completions to subscribers
  await descendentPubSub.publish({
    ...createEmptyDescendents(),
    completions: insertedCompletions,
  });

  const completedItemIds = new Set([
    ...existingCompletions.map((completion) => completion.itemId),
    ...insertedCompletions.map((completion) => completion.itemId),
  ]);

  const completedActivityThisTurn =
    items.every((item) => completedItemIds.has(item.id)) &&
    insertedCompletions.length > 0;

  return { completedActivityThisTurn };
}

/**
 * Analyzes the assistant response and conversation history to determine
 * which items have been newly completed.
 */
async function analyzeCompletions(
  userId: string,
  sortedMessages: Message[],
  incompleteItemNumbers: number[],
) {
  // Prepare the prompt for the LLM
  const prompt = `
You are analyzing a conversation to determine if any items have been completed.
The conversation is about an educational activity with multiple items.

Based on the assistant's most recent response, determine if any new items have been completed.
An item is considered completed when the assistant has acknowledged that that it's complete or if they say that they're moving on (in a way that implies the item's been completed satisfactorily).

The following items are still incomplete: ${incompleteItemNumbers.join(", ")}

Respond with XML tags indicating which items have been completed. For example:
<completed>23</completed>
<completed>24</completed>

If no new items have been completed, respond with:
<no-new-completions></no-new-completions>

Here is the conversation history:

${sortedMessages.map((msg, idx) => `${idx === sortedMessages.length - 1 ? "(BEGIN LAST MESSAGE)\n" : ""}${msg.senderRole}: ${msg.content}`).join("\n\n")}
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
    void notifyAdmin(
      "error determining completions or lack thereof (in prompt)",
      {
        prompt,
        llmResponse: {
          message: llmResponse.message,
          stack: llmResponse.stack,
        },
      },
    );
    throw llmResponse;
  }
  try {
    // Use the LLM to analyze the conversation

    // Extract completed item IDs from the LLM response
    const completedItemNumbers = extractCompletedItemNumbers(
      llmResponse,
      incompleteItemNumbers,
    );

    return { completedItemNumbers };
  } catch (e) {
    void notifyAdmin(
      "error determining completions or lack thereof (in parsing)",
      {
        prompt,
        llmResponse,
      },
    );
    throw e;
  }
}

/**
 * Extracts completed item IDs from the LLM response.
 */
function extractCompletedItemNumbers(
  llmResponse: string,
  validItemNumbers: number[],
) {
  const completedItemNumbers: number[] = [];

  // Check if the response indicates no new completions
  if (llmResponse.includes("<no-new-completions>")) {
    return [];
  }

  // Extract item IDs from <completed> tags
  const completedRegex = /<completed>(.*?)<\/completed>/g;
  let match;

  while ((match = completedRegex.exec(llmResponse)) !== null) {
    if (typeof match[1] !== "string") {
      throw new Error("Invalid match");
    }
    const itemNumber = parseInt(match[1].trim());
    // Only include valid item IDs
    if (validItemNumbers.includes(itemNumber)) {
      completedItemNumbers.push(itemNumber);
    } else {
      throw new Error("Invalid item number: " + itemNumber);
    }
  }

  return completedItemNumbers;
}
