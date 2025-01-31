import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper, isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { evalKeys, type EvalKey } from "~/server/db/schema";
import { type ActivityDescendentController } from "~/server/activityDescendents/types";

export const evalKeyService: ActivityDescendentController<EvalKey> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const evalKey = await tx
      .insert(evalKeys)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return evalKey;
  },
  async read({ activityId, enrolledAs, tx }) {
    if (!isGraderOrDeveloper(enrolledAs)) {
      return [];
    }
    return tx
      .select()
      .from(evalKeys)
      .where(eq(evalKeys.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const evalKeysNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(evalKeys)
          .set({ ...row, activityId })
          .where(
            and(eq(evalKeys.id, row.id), eq(evalKeys.activityId, activityId)),
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
      .delete(evalKeys)
      .where(
        and(inArray(evalKeys.id, ids), eq(evalKeys.activityId, activityId)),
      );
  },
};
