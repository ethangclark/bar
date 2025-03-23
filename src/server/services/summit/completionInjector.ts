// src/server/services/summit/completionInjection/completionInjector.ts
import { and, eq } from "drizzle-orm";
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
    where: and(
      eq(schema.completions.activityId, activityId),
      eq(schema.completions.userId, userId),
    ),
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
  const validItemNumbers = items.map((_, idx) => indexToItemNumber(idx));

  // Analyze the response to determine completed items
  const { completedItemNumbers } = await analyzeCompletions({
    userId,
    sortedMessages: [...prevMessages, assistantResponse],
    incompleteItemNumbers,
    validItemNumbers,
  });

  const completedThisTurn = completedItemNumbers.filter((n) =>
    incompleteItemNumbers.includes(n),
  );

  if (completedThisTurn.length === 0) {
    return { completedActivityThisTurn: false }; // No new completions
  }

  // Create new item completion records
  const newCompletions = completedThisTurn.map((itemNumber) => {
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
async function analyzeCompletions({
  userId,
  sortedMessages,
  incompleteItemNumbers,
  validItemNumbers,
}: {
  userId: string;
  sortedMessages: Message[];
  incompleteItemNumbers: number[];
  validItemNumbers: number[];
}) {
  // Prepare the prompt for the LLM
  const prompt = `
You are analyzing a conversation to determine if any items have been completed.
The conversation is about an educational activity with multiple items.

Determine which items have been completed, based on the assistant's most recent response.

An item is considered completed when the assistant has acknowledged that that it's complete or if they say that they're moving on to another item (in a way that doesn't imply they're "skipping" something the student is supposed to return to).

The following items are still incomplete: ${incompleteItemNumbers.join(", ")}

Respond with XML tags indicating which items have been completed. For example:
<item-completed>23</item-completed>
<item-completed>24</item-completed>

If no new items have been completed, respond with:
<no-new-completions></no-new-completions>

Here are some examples:

EXAMPLE 1:
user: I've finished the first exercise. What's next?
assistant: Great job completing item 1! Let's move on to item 2 now.
RESULT: <item-completed>1</item-completed>

EXAMPLE 2:
user: I'm stuck on problem 3. Can you help?
assistant: Let me explain how to approach problem 3. First, you need to...
RESULT: <no-new-completions></no-new-completions>

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
    const completedItemNumbers = extractCompletedItemNumbers({
      llmResponse,
      validItemNumbers,
    });

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
function extractCompletedItemNumbers({
  llmResponse,
  validItemNumbers,
}: {
  llmResponse: string;
  validItemNumbers: number[];
}) {
  const completedItemNumbers: number[] = [];

  // Check if the response indicates no new completions
  if (llmResponse.includes("<no-new-completions>")) {
    return [];
  }

  const asNumbers = llmResponse
    .trim()
    .split("\n")
    .map((v) => Number(v.trim()));
  if (asNumbers.every((v) => validItemNumbers.includes(v))) {
    return asNumbers;
  }

  // Extract item IDs from <item-completed> tags
  const completedRegex = /<item-completed>(.*?)<\/item-completed>/g;
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
      throw new Error(
        `Invalid item number: ${itemNumber}. Valid numbers: ${validItemNumbers.join(
          ", ",
        )}`,
      );
    }
  }

  return completedItemNumbers;
}
