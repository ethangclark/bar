import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { type Item } from "~/server/db/schema";
import { schema } from "../db";

function canRead() {
  return true;
}

export const itemController: DescendentController<Item> = {
  canRead,
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const items = await tx
      .insert(schema.items)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return items;
  },
  async read({ activityId, tx }) {
    if (!canRead()) {
      return [];
    }
    return tx
      .select()
      .from(schema.items)
      .where(eq(schema.items.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const itemsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(schema.items)
          .set({ ...row, activityId })
          .where(
            and(
              eq(schema.items.id, row.id),
              eq(schema.items.activityId, activityId),
            ),
          )
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
      .delete(schema.items)
      .where(
        and(
          inArray(schema.items.id, ids),
          eq(schema.items.activityId, activityId),
        ),
      );
  },
};
