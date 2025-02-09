import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper, isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { type EvalKey } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/types";
import { db } from "../db";

export const evalKeyController: DescendentController<EvalKey> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const evalKeys = await tx
      .insert(db.x.evalKeys)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return evalKeys;
  },
  async read({ activityId, enrolledAs, tx }) {
    if (!isGraderOrDeveloper(enrolledAs)) {
      return [];
    }
    return tx
      .select()
      .from(db.x.evalKeys)
      .where(eq(db.x.evalKeys.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const evalKeysNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(db.x.evalKeys)
          .set({ ...row, activityId })
          .where(
            and(
              eq(db.x.evalKeys.id, row.id),
              eq(db.x.evalKeys.activityId, activityId),
            ),
          )
          .returning(),
      ),
    );
    return evalKeysNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!isDeveloper(enrolledAs)) {
      return;
    }
    await tx
      .delete(db.x.evalKeys)
      .where(
        and(
          inArray(db.x.evalKeys.id, ids),
          eq(db.x.evalKeys.activityId, activityId),
        ),
      );
  },
};
