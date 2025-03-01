import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type ItemCompletion } from "~/server/db/schema";
import { schema } from "../db";

const canRead: DescendentController<ItemCompletion>["canRead"] = (
  itemCompletion,
  { enrolledAs, userId },
) => {
  return itemCompletion.userId === userId || isGrader(enrolledAs);
};

export const itemCompletionController: DescendentController<ItemCompletion> = {
  canRead,

  async create({ rows, enrolledAs, activityId, tx }) {
    if (!isGrader(enrolledAs)) {
      throw new Error("Only graders may create item completions");
    }

    const itemCompletions = await tx
      .insert(schema.itemCompletions)
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
    return itemCompletions;
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
      .from(schema.itemCompletions)
      .where(
        and(
          eq(schema.itemCompletions.activityId, activityId),
          inArray(schema.itemCompletions.userId, userIds),
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
      inArray(schema.itemCompletions.id, ids),
      eq(schema.itemCompletions.activityId, activityId),
    ];

    // graders can delete any item completion in the activity
    if (!isGrader(enrolledAs)) {
      andArgs.push(eq(schema.itemCompletions.userId, userId));
    }

    await tx.delete(schema.itemCompletions).where(and(...andArgs));
  },
};
