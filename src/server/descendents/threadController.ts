import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type Thread } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/types";
import { db } from "../db";
import { messagePubSub } from "../db/pubsub/messagePubSub";

export const threadController: DescendentController<Thread> = {
  // anyone can create a thread for themselves
  async create({ activityId, tx, rows, userId }) {
    const threads = await tx
      .insert(db.x.threads)
      .values(
        rows.map(({ createdAt: _, ...row }) => ({
          ...row,
          activityId,
          userId,
        })),
      )
      .returning();

    // TODO: abstract this out.
    // Should generate a system message including the whole activity and what they've completed.
    const messages = await tx
      .insert(db.x.messages)
      .values(
        threads.flatMap((thread) => [
          {
            threadId: thread.id,
            userId,
            content:
              "Yarg, this be the system prompt. Be speaking like a pirate in this interaction, matey.",
            senderRole: "system" as const,
            activityId,
          },
          {
            threadId: thread.id,
            userId,
            content: "Ahoy, matey! Let's be doing this lesson pirate-style.",
            senderRole: "assistant" as const,
            activityId,
          },
        ]),
      )
      .returning();
    await messagePubSub.publish(messages);

    return threads;
  },
  // anyone can read a thread for themselves
  async read({ activityId, tx, userId, enrolledAs, includeUserIds }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read threads for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }
    return tx
      .select()
      .from(db.x.threads)
      .where(
        and(
          eq(db.x.threads.activityId, activityId),
          inArray(db.x.threads.userId, userIds),
        ),
      );
  },
  // threads are immutable
  async update({ rows }) {
    if (rows.length > 0) {
      throw new Error("Thread update not supported");
    }
    return [];
  },
  // anyone can delete a thread for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(db.x.threads)
      .where(
        and(
          inArray(db.x.threads.id, ids),
          eq(db.x.threads.activityId, activityId),
          eq(db.x.threads.userId, userId),
        ),
      );
  },
};
