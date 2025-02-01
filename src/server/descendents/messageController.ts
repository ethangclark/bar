import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { messages, type Message } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/types";

export const messageService: DescendentController<Message> = {
  // anyone can create a message for themselves
  async create({ activityId, tx, rows, userId }) {
    const message = await tx
      .insert(messages)
      .values(
        rows.map(({ createdAt: _, ...row }) => ({
          ...row,
          activityId,
          userId,
        })),
      )
      .returning();
    return message;
  },
  // anyone can read a message for themselves
  async read({ activityId, tx, userId, enrolledAs, includeUserIds }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read messages for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }
    return tx
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.activityId, activityId),
          inArray(messages.userId, userIds),
        ),
      );
  },
  // messages are immutable
  async update({ rows }) {
    if (rows.length > 0) {
      throw new Error("Thread update not supported");
    }
    return [];
  },
  // anyone can delete a message for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(messages)
      .where(
        and(
          inArray(messages.id, ids),
          eq(messages.activityId, activityId),
          eq(messages.userId, userId),
        ),
      );
  },
};
