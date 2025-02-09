import { eq } from "drizzle-orm";
import { assertNever } from "~/common/errorUtils";
import { objectKeys } from "~/common/objectUtils";
import { db } from "~/server/db";
import { messagePubSub } from "~/server/db/pubsub/messagePubSub";
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

function fmtInfoText(infoText: InfoText) {
  return fmtSection("Information", infoText.content);
}

function fmtInfoImage(infoImage: InfoImage) {
  return fmtSection("Image", infoImage.textAlternative);
}

function fmtQuestion(question: Question) {
  return fmtSection("Question", question.content);
}

function itemTreeToString(
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
          result += fmtInfoText(item.infoText);
        }
        break;
      case "infoImage":
        if (item.infoImage) {
          result += fmtInfoImage(item.infoImage);
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
    .map((item, index) => itemTreeToString(index + 1, item))
    .join("");

  const messages = await db
    .insert(db.x.messages)
    .values([
      {
        threadId: thread.id,
        userId: thread.userId,
        content: `You are Summit, an AI learning assistant. Your goal is to drill the user on the material in the activity until they've demonstrated mastery of each item.

Go through the following items one by one with the student. For information and images, provide the information to the student, and ask enough questions to ensure they thoroughly understand the material. For questions, do not provide the answer -- the student is to figure out the answer. If they are unable to answer, or get the answer wrong, tutor them until they are able to answer it correctly and demonstrate knowledge of the material. If they want to skip an item, let them, but encourage them to return to it later to receive credit for it.

Here is the material to cover:

${itemContent}`,
        senderRole: "system" as const,
        activityId: thread.activityId,
      },
      {
        threadId: thread.id,
        userId: thread.userId,
        content:
          "My name is Summit. My goal is to help you master the material in this activity. Are you ready to begin?",
        senderRole: "assistant" as const,
        activityId: thread.activityId,
      },
    ])
    .returning();
  await messagePubSub.publish(messages);
}

export async function generateIntroMessages(threads: Thread[]) {
  await Promise.all(threads.map(beginThread));
}
