import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type Thread } from "~/server/db/schema";
import { db, schema } from "../db";
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
  async create({ activityId, tx, rows, userId, enqueueSideEffect }) {
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

    // COMMENT_003a; see COMMENT_003b
    enqueueSideEffect(() => generateIntroMessages(threads));

    return threads;
  },
  // anyone can read a thread for themselves
  async read({
    activityId,
    tx,
    userId,
    enrolledAs,
    includeUserIds,
    enqueueSideEffect,
  }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read threads for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }

    const threads = await tx
      .select()
      .from(schema.threads)
      .where(
        and(
          eq(schema.threads.activityId, activityId),
          inArray(schema.threads.userId, userIds),
        ),
      );

    if (threads.length > 0) {
      return threads;
    } else {
      // COMMENT_001a
      // Ensure there's at least one thread!
      // See COMMENT_001b
      const created = await db
        .insert(schema.threads)
        .values({
          activityId,
          userId,
        })
        .returning();

      // COMMENT_003b
      // Generate intro messages for the newly created thread
      // see COMMENT_003a
      enqueueSideEffect(() => generateIntroMessages(created));

      return created;
    }
  },
  // threads are immutable
  async update() {
    throw new Error("Thread update not supported");
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
