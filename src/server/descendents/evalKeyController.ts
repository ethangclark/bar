import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import {
  type EnrollmentType,
  isDeveloper,
  isGraderOrDeveloper,
} from "~/common/enrollmentTypeUtils";
import { type EvalKey } from "~/server/db/schema";
import { schema } from "../db";

function canRead(enrolledAs: EnrollmentType[]) {
  return isGraderOrDeveloper(enrolledAs);
}

export const evalKeyController: DescendentController<EvalKey> = {
  canRead(_, { enrolledAs }) {
    return canRead(enrolledAs);
  },

  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const evalKeys = await tx
      .insert(schema.evalKeys)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return evalKeys;
  },
  async read({ activityId, enrolledAs, tx }) {
    if (!canRead(enrolledAs)) {
      return [];
    }
    return tx
      .select()
      .from(schema.evalKeys)
      .where(eq(schema.evalKeys.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const evalKeysNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(schema.evalKeys)
          .set({ ...row, activityId })
          .where(
            and(
              eq(schema.evalKeys.id, row.id),
              eq(schema.evalKeys.activityId, activityId),
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
      .delete(schema.evalKeys)
      .where(
        and(
          inArray(schema.evalKeys.id, ids),
          eq(schema.evalKeys.activityId, activityId),
        ),
      );
  },
};
