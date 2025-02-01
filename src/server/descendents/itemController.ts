import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { items, type Item } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/types";

export const itemController: DescendentController<Item> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const item = await tx
      .insert(items)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return item;
  },
  async read({ activityId, tx }) {
    return tx.select().from(items).where(eq(items.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const itemsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(items)
          .set({ ...row, activityId })
          .where(and(eq(items.id, row.id), eq(items.activityId, activityId)))
          .returning(),
      ),
    );
    return itemsNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!isDeveloper(enrolledAs)) {
      return;
    }
    await tx
      .delete(items)
      .where(and(inArray(items.id, ids), eq(items.activityId, activityId)));
  },
};
