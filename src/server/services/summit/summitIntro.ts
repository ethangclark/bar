import { eq, sql } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import { createEmptyDescendents } from "~/common/descendentUtils";
import {
  numericIdToImageNumber,
  numericIdToVideoNumber,
} from "~/common/idUtils";
import { sortByOrderFracIdx } from "~/common/indexUtils";
import { objectKeys } from "~/common/objectUtils";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import {
  type ItemWithDescendents,
  type Question,
  type Thread,
} from "~/server/db/schema";

function fmtSection(header: string, content: string, completed: boolean) {
  return `### ${header}${completed ? " (complete -- skip unless something builds on it, in which case re-present the material without tutoring them through it)" : ""}\n${content}\n\n`;
}

export function fmtInfoText(content: string, completed: boolean) {
  return fmtSection("Information", content, completed);
}

export const imageOmissionDisclaimer = `image omitted; description follows`;
export const videoOmissionDisclaimer = `video omitted; description follows`;

export const imageHeaderWithOmissionDisclaimer = (numericId: number) =>
  `Image ${numericIdToImageNumber(numericId)} (${imageOmissionDisclaimer})`;

export const videoHeaderWithOmissionDisclaimer = (numericId: number) =>
  `Video ${numericIdToVideoNumber(numericId)} (${videoOmissionDisclaimer})`;

export function fmtInfoImage(
  numericId: number,
  textAlternative: string,
  completed: boolean,
) {
  return fmtSection(
    imageHeaderWithOmissionDisclaimer(numericId),
    textAlternative,
    completed,
  );
}

function fmtInfoVideo(
  numericId: number,
  textAlternative: string,
  completed: boolean,
) {
  return fmtSection(
    videoHeaderWithOmissionDisclaimer(numericId),
    textAlternative,
    completed,
  );
}

function fmtQuestion(question: Question, completed: boolean) {
  return fmtSection("Question", question.content, completed);
}

function itemToString(
  itemNumber: number,
  item: ItemWithDescendents,
  isCompleted: boolean,
) {
  let result = `## Item ${itemNumber}.\n`;
  for (const key of objectKeys(item)) {
    switch (key) {
      case "id":
      case "activityId":
      case "orderFracIdx":
        break;
      case "infoText":
        if (item.infoText) {
          result += fmtInfoText(item.infoText.content, isCompleted);
        }
        break;
      case "infoImage":
        if (item.infoImage) {
          result += fmtInfoImage(
            item.infoImage.numericId,
            item.infoImage.textAlternative,
            isCompleted,
          );
        }
        break;
      case "infoVideo":
        if (item.infoVideo) {
          result += fmtInfoVideo(
            item.infoVideo.numericId,
            item.infoVideo.textAlternative,
            isCompleted,
          );
        }
        break;
      case "question":
        if (item.question) {
          result += fmtQuestion(item.question, isCompleted);
        }
        break;
      default:
        assertTypesExhausted(key);
    }
  }
  return result;
}

export async function insertIntroMessages(thread: Thread) {
  const items = await db.query.items.findMany({
    where: eq(schema.items.activityId, thread.activityId),
    with: {
      infoText: true,
      infoImage: true,
      infoVideo: true,
      question: {
        with: {
          evalKey: true,
        },
      },
      completions: {
        where: eq(schema.completions.userId, thread.userId),
      },
    },
    orderBy: (items, { asc }) => [asc(items.orderFracIdx)],
  });
  const itemContent = sortByOrderFracIdx(items)
    .map((item, index) =>
      itemToString(index + 1, item, item.completions.length > 0),
    )
    .join("");

  const messages = await db
    .insert(schema.messages)
    .values([
      {
        threadId: thread.id,
        userId: thread.userId,
        content: `You are Summit, an AI learning assistant. Your goal is to drill the user on the material in the activity until they've demonstrated mastery of each item.

You will be given items to work through with the student.

For information, images, and videos, provide the information to the student, and ask enough questions to ensure they thoroughly understand the material. Use your judgment on how to do this; if the content of an item is just a small detail of the overall activity, you don't have to grill them on it -- maybe you'll even want to combine several small items together and cover them in one go. Conversely, break up and dive deeper into more challenging material.

For questions, do not provide the answer -- the student must figure it out themselves. If they are unable to answer, or get the answer wrong, tutor them until they are able to answer it correctly.

If they want to skip an item, let them, but encourage them to return to it later to receive credit for it. Be sure to let the student know which items you are working with them on at any given time, and let them know when you're moving on to a new item or items.

Always mention the image or video number when referring to an image or video.

The student doesn't have the material on hand, so you'll have to provide it to them (besides question answers, of course).

Make sure not to confuse them by alluding to material you haven't given them yet.

Here is the material to cover:

${itemContent}`,
        senderRole: "system" as const,
        activityId: thread.activityId,
        doneGenerating: true,
        createdAt: sql`now() - interval '1 second'`,
      },
      {
        threadId: thread.id,
        userId: thread.userId,
        content:
          "Hi! My name is Summit. My goal is to help you master the material in this activity. Are you ready to begin?",
        senderRole: "assistant" as const,
        activityId: thread.activityId,
        doneGenerating: true,
      },
    ])
    .returning();

  return messages;
}

async function beginThread(thread: Thread) {
  const messages = await insertIntroMessages(thread);

  const descendents = {
    ...createEmptyDescendents(),
    messages,
  };
  await descendentPubSub.publish(descendents);
}

export async function generateIntroMessages(threads: Thread[]) {
  await Promise.all(threads.map(beginThread));
}
