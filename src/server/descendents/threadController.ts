import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { threads, type Thread } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/types";

export const threadController: DescendentController<Thread> = {
  // anyone can create a thread for themselves
  async create({ activityId, tx, rows, userId }) {
    const thread = await tx
      .insert(threads)
      .values(
        rows.map(({ createdAt: _, ...row }) => ({
          ...row,
          activityId,
          userId,
        })),
      )
      .returning();
    return thread;
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
      .from(threads)
      .where(
        and(
          eq(threads.activityId, activityId),
          inArray(threads.userId, userIds),
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
      .delete(threads)
      .where(
        and(
          inArray(threads.id, ids),
          eq(threads.activityId, activityId),
          eq(threads.userId, userId),
        ),
      );
  },
};
