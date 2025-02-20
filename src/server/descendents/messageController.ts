import { and, eq, inArray } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type Message } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { schema } from "../db";
import { respondToUserMessages } from "../services/summit/summitResponse";

const canRead: DescendentController<Message>["canRead"] = (
  message,
  { enrolledAs, userId },
) => {
  return message.userId === userId || isGrader(enrolledAs);
};

export const messageController: DescendentController<Message> = {
  canRead,

  // anyone can create a message for themselves
  async create({ activityId, tx, rows, userId, enqueueSideEffect }) {
    const messages = await tx
      .insert(schema.messages)
      .values(
        rows.map(({ createdAt: _, ...row }) => ({
          ...row,
          activityId,
          userId,
          senderRole: "user" as const,
        })),
      )
      .returning();

    enqueueSideEffect(() => respondToUserMessages(messages));

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
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.activityId, activityId),
          inArray(schema.messages.userId, userIds),
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
      .delete(schema.messages)
      .where(
        and(
          inArray(schema.messages.id, ids),
          eq(schema.messages.activityId, activityId),
          eq(schema.messages.userId, userId),
        ),
      );
  },
};
