// src/server/services/summit/completionInjection/completionInjector.ts
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { filter } from "~/common/fnUtils";
import {
  indexToItemNumber,
  itemNumberToIndex,
  sortByOrderFracIdx,
} from "~/common/indexUtils";
import { getLlmResponse } from "~/server/ai/llm";
import { defaultModel } from "~/server/ai/llm/types";
import { db, schema } from "~/server/db";
import { publishDescendentUpserts } from "~/server/db/pubsub/descendentPubSub";
import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { notifyAdmin } from "../../email/notifyAdmin";

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

  const ogCompletedItemIds = new Set(existingCompletions.map((c) => c.itemId));
  const ogCompletedBools = items.map((item) => ogCompletedItemIds.has(item.id));

  const validItemNumbers = items.map((_, idx) => indexToItemNumber(idx));

  const ogIncompleteItemNumbers = filter(
    ogCompletedBools.map((completed, idx) =>
      completed ? null : indexToItemNumber(idx),
    ),
    z.number(),
  );

  // Analyze the response to determine completed items
  const { completedItemNumbers } = await analyzeCompletions({
    userId,
    sortedMessages: [...prevMessages, assistantResponse],
    validItemNumbers,
  });

  const completedThisTurn = completedItemNumbers.filter((n) =>
    ogIncompleteItemNumbers.includes(n),
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
  await publishDescendentUpserts({
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
  validItemNumbers,
}: {
  userId: string;
  sortedMessages: Message[];
  validItemNumbers: number[];
}) {
  // Prepare the prompt for the LLM
  const prompt = `
You are being asked to analyze a conversation between a learning assistant and a student in order to determine which lesson items have been completed.

Informational items (informational text, images, videos, etc) are considered complete if the learning assistant has presented them to the student.

Questions are considered complete if the student has answered them in a way that's satisfactory to the learning assistant.

You are to respond with the completed items' numbers in <complete> tags, and the numbers of items that are in progress in <in-progress> tags, like so:
<complete>1</complete>
<complete>2</complete>
<complete>3</complete>
<complete>4</complete>
<complete>5</complete>
<complete>6</complete>
<complete>7</complete>
<complete>8</complete>
<complete>9</complete>
<complete>10</complete>
<complete>11</complete>
<complete>12</complete>
<complete>13</complete>
<in-progress>14</in-progress>

If no items are complete OR in progress, respond with:
<none></none>

Here are some examples:

EXAMPLE 1:
assistant: Let's start with item 1. It's this: The mitochondrion is the powerhouse of the cell.
user: Got it.
assistant: Great! Now let's move on to item 2. The ribosome is the cell's protein factory.
user: Sounds good.
assistant: Alright -- on to item 3. It's this: The cell membrane is the cell's outer wall.
user: Why is it called a wall?
assistant: It's called a wall because it surrounds the cell and protects it.
RESULT:
<complete>1</complete>
<complete>2</complete>
<in-progress>3</in-progress>

EXAMPLE 2:
assistant: Here's the first item: The quadratic equation is derived via completing the square.
user: What's that?
assistant: It's a method by which both sides of the equations are transformed into a form that can be factored into two binomials.
user: Got it.
assistant: Great! Now let's move on to item 2. Use the quadratic formula to solve for x in the equation x^2 + 2x - 3 = 0.
user: Let's skip this and come back to it later.
assistant: Alright, I'll save it for later. Item 3 is this: What are the roots of the equation 2x^2 + 4x - 6 = 0?
RESULT:
<complete>1</complete>
<in-progress>3</in-progress>

EXAMPLE 3:
assistant: Hi! I'm Summit, your learning assistant.
RESULT:
<none></none>

EXAMPLE 4:
user: Am I done?
assistant: You're all done!
RESULT:
<complete>1</complete>
<complete>2</complete>
<complete>3</complete>
<complete>4</complete>
<complete>5</complete>
<complete>6</complete>
<complete>7</complete>
<complete>8</complete>
<complete>9</complete>
<complete>10</complete>
(or however many items there are)

Here is the conversation history to analyze. Good luck!

BEGIN CONVERSATION

${sortedMessages.map((msg) => `${msg.senderRole}: ${msg.content}`).join("\n\n")}

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
  if (llmResponse.includes("<none>")) {
    return [];
  }

  const asNumbers = llmResponse
    .trim()
    .split("\n")
    .map((v) => Number(v.trim()));
  if (asNumbers.every((v) => validItemNumbers.includes(v))) {
    return asNumbers;
  }

  // Extract item IDs from <complete> tags
  const completedRegex = /<complete>(.*?)<\/complete>/g;
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
