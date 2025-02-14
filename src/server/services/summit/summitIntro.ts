import { eq } from "drizzle-orm";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { assertNever } from "~/common/errorUtils";
import { numericIdToImageNumber } from "~/common/idUtils";
import { objectKeys } from "~/common/objectUtils";
import { db } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import {
  type EvalKey,
  type InfoImage,
  type InfoText,
  type Item,
  type Question,
  type Thread,
} from "~/server/db/schema";

function fmtSection(header: string, content: string) {
  return `### ${header}\n${content}\n\n`;
}

export function fmtInfoText(content: string) {
  return fmtSection("Information", content);
}

export const omissionDisclaimer = `omitted; text alternative follows`;

export const imageHeaderWithOmissionDisclaimer = (numericId: number) =>
  `Image ${numericIdToImageNumber(numericId)} (${omissionDisclaimer})`;

export function fmtInfoImage(numericId: number, textAlternative: string) {
  return fmtSection(
    imageHeaderWithOmissionDisclaimer(numericId),
    textAlternative,
  );
}

function fmtQuestion(question: Question) {
  return fmtSection("Question", question.content);
}

function itemToString(
  itemNumber: number,
  item: Item & {
    infoText: InfoText | null;
    infoImage: InfoImage | null;
    question:
      | null
      | (Question & {
          evalKey: null | EvalKey;
        });
  },
) {
  let result = `## Item ${itemNumber}.\n`;
  objectKeys(item).forEach((key) => {
    switch (key) {
      case "id":
      case "activityId":
      case "orderFracIdx":
        break;
      case "infoText":
        if (item.infoText) {
          result += fmtInfoText(item.infoText.content);
        }
        break;
      case "infoImage":
        if (item.infoImage) {
          result += fmtInfoImage(
            item.infoImage.numericId,
            item.infoImage.textAlternative,
          );
        }
        break;
      case "question":
        if (item.question) {
          result += fmtQuestion(item.question);
        }
        break;
      default:
        assertNever(key);
    }
  });
  return result;
}

async function beginThread(thread: Thread) {
  const items = await db.query.items.findMany({
    where: eq(db.x.items.activityId, thread.activityId),
    with: {
      infoText: true,
      infoImage: true,
      question: {
        with: {
          evalKey: true,
        },
      },
    },
    orderBy: (items, { asc }) => [asc(items.orderFracIdx)],
  });
  const itemContent = items
    .map((item, index) => itemToString(index + 1, item))
    .join("");

  const messages = await db
    .insert(db.x.messages)
    .values([
      {
        threadId: thread.id,
        userId: thread.userId,
        content: `You are Summit, an AI learning assistant. Your goal is to drill the user on the material in the activity until they've demonstrated mastery of each item.

Go through the following items with the student. For information and images, provide the information to the student, and ask enough questions to ensure they thoroughly understand the material. For questions, do not provide the answer -- the student is to figure out the answer. If they are unable to answer, or get the answer wrong, tutor them until they are able to answer it correctly. If they want to skip an item, let them, but encourage them to return to it later to receive credit for it. Be sure to let the student know which items you are working with them on at any given time.

When you're sharing a text alternative of an image, let the student know that you're going over an image with them, but that you're sharing its text alternative.

Here is the material to cover:

${itemContent}`,
        senderRole: "system" as const,
        activityId: thread.activityId,
      },
      {
        threadId: thread.id,
        userId: thread.userId,
        content:
          "Hi! My name is Summit. My goal is to help you master the material in this activity. Are you ready to begin?",
        senderRole: "assistant" as const,
        activityId: thread.activityId,
      },
    ])
    .returning();

  const descendents = createEmptyDescendents();
  descendents.messages.push(...messages);
  await descendentPubSub.publish(descendents);
}

export async function generateIntroMessages(threads: Thread[]) {
  await Promise.all(threads.map(beginThread));
}
