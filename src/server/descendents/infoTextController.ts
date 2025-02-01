import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { infoTexts, type InfoText } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/types";

export const infoTextController: DescendentController<InfoText> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoText = await tx
      .insert(infoTexts)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return infoText;
  },
  async read({ activityId, tx }) {
    return tx
      .select()
      .from(infoTexts)
      .where(eq(infoTexts.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoTextsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(infoTexts)
          .set({ ...row, activityId })
          .where(
            and(eq(infoTexts.id, row.id), eq(infoTexts.activityId, activityId)),
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
      .delete(infoTexts)
      .where(
        and(inArray(infoTexts.id, ids), eq(infoTexts.activityId, activityId)),
      );
  },
};
