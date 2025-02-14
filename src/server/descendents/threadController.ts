import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type Thread } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";
import { generateIntroMessages } from "../services/summit/summitIntro";

const canRead: DescendentController<Thread>["canRead"] = (
  thread,
  { enrolledAs, userId },
) => {
  return thread.userId === userId || isGrader(enrolledAs);
};

export const threadController: DescendentController<Thread> = {
  canRead,

  // anyone can create a thread for themselves
  async create({ activityId, tx, rows, userId, afterTx }) {
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

    afterTx(() => generateIntroMessages(threads));

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
