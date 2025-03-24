import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type Flag } from "~/server/db/schema";
import { schema } from "../db";

const canRead: DescendentController<Flag>["canRead"] = (
  flag,
  { enrolledAs, userId },
) => {
  return flag.userId === userId || isGrader(enrolledAs);
};

export const flagController: DescendentController<Flag> = {
  canRead,

  async create({ rows, enrolledAs, activityId, tx }) {
    if (!isGrader(enrolledAs)) {
      throw new Error("Only graders may create flags");
    }

    const flags = await tx
      .insert(schema.flags)
      .values(
        rows.map((row) => ({
          ...row,
          // IMPORTANT: allowing any userId (assuming it's a grader)
          // -- only overriding the passed activityId with the one
          // determined by the controller
          activityId,
        })),
      )
      .returning();
    return flags;
  },
  // anyone can read an flag for themselves
  async read({ activityId, tx, userId, enrolledAs, includeUserIds }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read flags for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }
    return tx
      .select()
      .from(schema.flags)
      .where(
        and(
          eq(schema.flags.activityId, activityId),
          inArray(schema.flags.userId, userIds),
        ),
      );
  },
  async update({ activityId, tx, rows, userId }) {
    for (const row of rows) {
      await tx
        .update(schema.flags)
        .set({
          reason: row.reason,
        })
        .where(
          and(
            eq(schema.flags.activityId, activityId),
            eq(schema.flags.userId, userId),
            eq(schema.flags.messageId, row.messageId),
          ),
        );
    }
    return rows;
  },
  // anyone can delete an flag for themselves
  async delete({ activityId, tx, ids, userId, enrolledAs }) {
    const andArgs = [
      inArray(schema.flags.id, ids),
      eq(schema.flags.activityId, activityId),
    ];

    // graders can delete any flag in the activity
    if (!isGrader(enrolledAs)) {
      andArgs.push(eq(schema.flags.userId, userId));
    }

    await tx.delete(schema.flags).where(and(...andArgs));
  },
};
