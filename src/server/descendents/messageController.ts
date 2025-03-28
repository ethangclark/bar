import { and, eq, inArray } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { invoke } from "~/common/fnUtils";
import { type Message } from "~/server/db/schema";
import { db, schema } from "../db";
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
    const user = await tx.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new Error("User not found");
    }
    let messages = await tx
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.activityId, activityId),
          inArray(schema.messages.userId, userIds),
        ),
      );
    messages = messages
      .filter((m) => {
        switch (m.senderRole) {
          case "system":
            return user.isAdmin;
          case "assistant":
            return true;
          case "user":
            return userIds.includes(m.userId);
          default:
            assertTypesExhausted(m.senderRole);
        }
      })
      .map((m) => ({
        ...m,
        status:
          m.status === "incomplete" ? "completeWithoutViewPieces" : m.status,
      }));

    // this is a reminder to revisit this logic if the enum values change
    // (this should throw a type error in that case)
    invoke(() => {
      const dummyStatus = messages[0]?.status;
      switch (dummyStatus) {
        case undefined:
        case "incomplete":
        case "completeWithViewPieces":
        case "completeWithoutViewPieces":
          break;
        default:
          assertTypesExhausted(dummyStatus);
      }
    });

    // ensure all incomplete messages are marked as complete
    // (in case server was interrupted)
    void db
      .update(schema.messages)
      .set({ status: "completeWithoutViewPieces" })
      .where(
        and(
          eq(schema.messages.status, "incomplete"),
          eq(schema.messages.activityId, activityId),
          inArray(schema.messages.userId, userIds),
        ),
      );

    return messages;
  },
  async update() {
    throw new Error("Message update not supported");
  },
  async delete() {
    throw new Error("Message deletion not supported");
  },
};
