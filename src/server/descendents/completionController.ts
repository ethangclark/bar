import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type Completion } from "~/server/db/schema";
import { schema } from "../db";

const canRead: DescendentController<Completion>["canRead"] = (
  completion,
  { enrolledAs, userId },
) => {
  return completion.userId === userId || isGrader(enrolledAs);
};

export const completionController: DescendentController<Completion> = {
  canRead,

  async create({ rows, enrolledAs, activityId, tx }) {
    if (!isGrader(enrolledAs)) {
      throw new Error("Only graders may create item completions");
    }

    const completions = await tx
      .insert(schema.completions)
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
    return completions;
  },
  // anyone can read an item completion for themselves
  async read({ activityId, tx, userId, enrolledAs, includeUserIds }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read item completions for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }
    return tx
      .select()
      .from(schema.completions)
      .where(
        and(
          eq(schema.completions.activityId, activityId),
          inArray(schema.completions.userId, userIds),
        ),
      );
  },
  // item completions are immutable
  async update() {
    throw new Error("Item completion update not supported");
  },
  // anyone can delete an item completion for themselves
  async delete({ activityId, tx, ids, userId, enrolledAs }) {
    const andArgs = [
      inArray(schema.completions.id, ids),
      eq(schema.completions.activityId, activityId),
    ];

    // graders can delete any item completion in the activity
    if (!isGrader(enrolledAs)) {
      andArgs.push(eq(schema.completions.userId, userId));
    }

    await tx.delete(schema.completions).where(and(...andArgs));
  },
};
