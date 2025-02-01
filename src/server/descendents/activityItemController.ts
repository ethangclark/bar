import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { activityItems, type ActivityItem } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/types";

export const activityItemService: DescendentController<ActivityItem> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const activityItem = await tx
      .insert(activityItems)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return activityItem;
  },
  async read({ activityId, tx }) {
    return tx
      .select()
      .from(activityItems)
      .where(eq(activityItems.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const activityItemsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(activityItems)
          .set({ ...row, activityId })
          .where(
            and(
              eq(activityItems.id, row.id),
              eq(activityItems.activityId, activityId),
            ),
          )
          .returning(),
      ),
    );
    return activityItemsNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!isDeveloper(enrolledAs)) {
      return;
    }
    await tx
      .delete(activityItems)
      .where(
        and(
          inArray(activityItems.id, ids),
          eq(activityItems.activityId, activityId),
        ),
      );
  },
};
