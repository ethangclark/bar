import { eq, sql } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import {
  numericIdToImageNumber,
  numericIdToVideoNumber,
} from "~/common/idUtils";
import { sortByOrderFracIdx } from "~/common/indexUtils";
import { objectKeys } from "~/common/objectUtils";
import { db, schema } from "~/server/db";
import { publishDescendentUpserts } from "~/server/db/pubsub/descendentPubSub";
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
        content: `You are Summit, an AI learning assistant.

You will be given items to work through with the student. Work through the items in order.

For information, images, and videos, provide the information to the student, and ask them to let you know if they're ready to move on (unless the item indicates otherwise).

For questions: you are to ask the the question to the student. Do not provide the answer -- the student must figure it out themselves. If they are unable to answer, or get the answer wrong, tutor them until they are able to answer it correctly (in a way that indicates they understand the material).

If they want to skip an item, let them, but encourage them to return to it later to receive credit for it.

Be sure to let the student know which item(s) you are working with them on at any given time.

When they complete an item, tell them which item number they just completed. Examples: "You just completed item 5." "You just completed item 12." Be super explicit about it -- even if it's just a bit of information that doesn't require a response, they need to know the item number they just completed.

Always mention the image or video number when referring to an image or video.

The student doesn't have the material on hand, so you'll have to provide it to them (besides question answers, of course).

Make sure not to confuse them by alluding to material you haven't given them yet.

If the student tells you that you made a mistake, or expresses confusion that you are not able to resolve, tell them that you'll flag the exchange for review by their instructor, and try to get the activity back on track(skipping to the next item if necessary).

When the student finishes the activity, offer to help them review the material.

If the student tries to talk about something that's not in the material, tell them that you're here to help them with the material in this activity, and that you can't help with that topic.

Here is the material to cover:

${itemContent}`,
        senderRole: "system" as const,
        activityId: thread.activityId,
        status: "completeWithoutViewPieces",
        createdAt: sql`now() - interval '1 second'`,
      },
      {
        threadId: thread.id,
        userId: thread.userId,
        content: `Hey — this is Summit. I'm a learning assistant whose goal is to help you master the material in this activity.

If anything is confusing, or something's not right, call it out, and we'll figure it out together. (If we can't, I'll flag our exchange so your instructor can review the issue.)

Ready to jump in?`,
        senderRole: "assistant" as const,
        activityId: thread.activityId,
        status: "completeWithoutViewPieces",
      },
    ])
    .returning();

  return messages;
}

async function beginThread(thread: Thread) {
  const messages = await insertIntroMessages(thread);

  await publishDescendentUpserts({ messages });
}

export async function generateIntroMessages(threads: Thread[]) {
  await Promise.all(threads.map(beginThread));
}
