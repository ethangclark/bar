import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type Message } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";
import { respondToUserMessages } from "../services/summit/summitResponse";

const canRead: DescendentController<Message>["canRead"] = (
  message,
  { enrolledAs, userId },
) => {
  if (message.userId === userId) {
    return true;
  }
  if (isGrader(enrolledAs)) {
    return true;
  }
  return false;
};

function canWrite() {
  return true;
}

export const messageController: DescendentController<Message> = {
  canRead,
  canWrite,

  // anyone can create a message for themselves
  async create({ activityId, tx, rows, userId, afterTx }) {
    const messages = await tx
      .insert(db.x.messages)
      .values(
        rows.map(({ createdAt: _, ...row }) => ({
          ...row,
          activityId,
          userId,
          senderRole: "user" as const,
        })),
      )
      .returning();

    afterTx(() => respondToUserMessages(messages));

    return messages;
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
      .from(db.x.messages)
      .where(
        and(
          eq(db.x.messages.activityId, activityId),
          inArray(db.x.messages.userId, userIds),
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
      .delete(db.x.messages)
      .where(
        and(
          inArray(db.x.messages.id, ids),
          eq(db.x.messages.activityId, activityId),
          eq(db.x.messages.userId, userId),
        ),
      );
  },
};
