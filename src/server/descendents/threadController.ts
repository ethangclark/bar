import { and, eq, inArray } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type Thread } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { schema } from "../db";
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
  async create({ activityId, tx, rows, userId, enqueueAgentEffect }) {
    const threads = await tx
      .insert(schema.threads)
      .values(
        rows.map(({ createdAt: _, ...row }) => ({
          ...row,
          activityId,
          userId,
        })),
      )
      .returning();

    enqueueAgentEffect(() => generateIntroMessages(threads));

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
      .from(schema.threads)
      .where(
        and(
          eq(schema.threads.activityId, activityId),
          inArray(schema.threads.userId, userIds),
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
      .delete(schema.threads)
      .where(
        and(
          inArray(schema.threads.id, ids),
          eq(schema.threads.activityId, activityId),
          eq(schema.threads.userId, userId),
        ),
      );
  },
};
