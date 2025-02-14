import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { type EnrollmentType, isDeveloper } from "~/common/enrollmentTypeUtils";
import { type Item } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

function canRead() {
  return true;
}

function canWrite(enrolledAs: EnrollmentType[]) {
  return isDeveloper(enrolledAs);
}

export const itemController: DescendentController<Item> = {
  canRead() {
    return canRead();
  },
  canWrite(_, { enrolledAs }) {
    return canWrite(enrolledAs);
  },
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!canWrite(enrolledAs)) {
      return [];
    }
    const items = await tx
      .insert(db.x.items)
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
      .from(db.x.items)
      .where(eq(db.x.items.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!canWrite(enrolledAs)) {
      return [];
    }
    const itemsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(db.x.items)
          .set({ ...row, activityId })
          .where(
            and(
              eq(db.x.items.id, row.id),
              eq(db.x.items.activityId, activityId),
            ),
          )
          .returning(),
      ),
    );
    return itemsNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!canWrite(enrolledAs)) {
      return;
    }
    await tx
      .delete(db.x.items)
      .where(
        and(inArray(db.x.items.id, ids), eq(db.x.items.activityId, activityId)),
      );
  },
};
