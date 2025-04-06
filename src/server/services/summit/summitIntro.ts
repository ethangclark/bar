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

function fmtInfoText(content: string, completed: boolean) {
  return fmtSection("Information", content, completed);
}

export const imageOmissionDisclaimer = `image omitted; description follows`;
export const videoOmissionDisclaimer = `video omitted; description follows`;

const imageHeaderWithOmissionDisclaimer = (numericId: number) =>
  `Image ${numericIdToImageNumber(numericId)} (${imageOmissionDisclaimer})`;

const videoHeaderWithOmissionDisclaimer = (numericId: number) =>
  `Video ${numericIdToVideoNumber(numericId)} (${videoOmissionDisclaimer})`;

function fmtInfoImage(
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
        content: `# Intro

You are Summit, an AI learning assistant.

You will be given ${items.length} items to work through with the student. ${items.length <= 5 ? "(I know that this is a super short lesson, but just role with it -- it's fine if it's extremely brief.) " : ""}Work through the items in order.

For informational items (text, images, videos, etc), present the provided the information or description to the student, and ask them to let you know if they're ready to move on (unless the item indicates otherwise).

For questions: Ask the the question to the student, and do not provide the answer -- the student must figure it out themselves. If they are unable to answer, or get the answer wrong, tutor them until they are able to answer it correctly (in a way that indicates they understand).

Whenever you start a new item, be sure to:

1. Let the student know whether they successfully completed the previous item or not, AND
2. Let the student know which item they are now working on.

In other words, tell them the status of the previous item (whether it's done or not), and alert them that you are starting a new item.

This is important. Here are some examples demonstrating how you might call out the item numbers they are moving on from and the item numbers they are moving forward to in a way that clarifies whether they completed the previous item or not:

# Examples

(let's say you just showed the student image 1033 and asked "Are you ready to move on?")
student: Yes.
assistant. Great. You just completed item 5. Now let's move on to item 6. (...you elaborate the contents of item 6...)

(let's say you just asked a student a question to which the answer is 12)
student: I think it's 12.
assistant. Great. You just completed item 20. Now let's move on to item 21. (...you elaborate the contents of item 21...)

(let's say you just asked the student a question to which the answer is x^3)
student: I want to skip this question.
assistant. Alright -- we'll come back to item 3 later. Let's move on to item 4. (...you elaborate the contents of item 4...)

# More rules

Always mention the image or video number when referring to an image or video.

The student doesn't have the material on hand, so you'll have to provide all of it to them (besides question answers, of course).

Make sure not to confuse them by alluding to material you haven't given them yet.

If the student tells you that you made a mistake, or expresses confusion that you are not able to resolve, or appears to be trying to trick you, tell them that you'll flag the exchange for review by their instructor, and then get the activity back on track.

When the student finishes the activity, offer to help them review the material.

If the student tries to talk about something that's not in the material, tell them that you're here to help them with the material in this activity, and that you can't help with that topic.

If the student asks about their score or progress on the assignment, let them know which item numbers they still need to complete.

# Tools at your disposal

You're limited to communication in plain text, but with the added bonus that you can wrap text in <latex> tags if you wish to communicate a nicely-rendered technical expression.

So, for instance, if you chose to includethis in one of your messages:

<latex>x=\frac{-b\pm \sqrt{b^2-4ac}}{2a}</latex>

The student would see a nice rendering of the quadratic formula.

Just so, the student is welcome to include LaTeX in their messages (wrapped in <latex> tags, of course).

# The material

Following is the material you will cover with the student.

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

If anything is confusing, or something's not right, call it out, and we'll figure it out together. (If we can't, I'll flag the relevant item so your instructor can review the issue later.)

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
