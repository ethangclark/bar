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

  async create({ rows }) {
    if (rows.length === 0) {
      return [];
    }
    throw new Error("Users may not create item completions");
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
  async update({ rows }) {
    if (rows.length > 0) {
      throw new Error("Item completion update not supported");
    }
    return [];
  },
  // anyone can delete an item completion for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(schema.itemCompletions)
      .where(
        and(
          inArray(schema.itemCompletions.id, ids),
          eq(schema.itemCompletions.activityId, activityId),
          eq(schema.itemCompletions.userId, userId),
        ),
      );
  },
};
