import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { type InfoText } from "~/server/db/schema";
import { schema } from "../db";

function canRead() {
  return true;
}

export const infoTextController: DescendentController<InfoText> = {
  canRead,
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoTexts = await tx
      .insert(schema.infoTexts)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return infoTexts;
  },
  async read({ activityId, tx }) {
    if (!canRead()) {
      return [];
    }
    return tx
      .select()
      .from(schema.infoTexts)
      .where(eq(schema.infoTexts.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoTextsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(schema.infoTexts)
          .set({ ...row, activityId })
          .where(
            and(
              eq(schema.infoTexts.id, row.id),
              eq(schema.infoTexts.activityId, activityId),
            ),
          )
          .returning(),
      ),
    );
    return infoTextsNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!isDeveloper(enrolledAs)) {
      return;
    }
    await tx
      .delete(schema.infoTexts)
      .where(
        and(
          inArray(schema.infoTexts.id, ids),
          eq(schema.infoTexts.activityId, activityId),
        ),
      );
  },
};
