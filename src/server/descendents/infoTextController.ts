import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { type InfoText } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

export const infoTextController: DescendentController<InfoText> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoTexts = await tx
      .insert(db.x.infoTexts)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return infoTexts;
  },
  async read({ activityId, tx }) {
    return tx
      .select()
      .from(db.x.infoTexts)
      .where(eq(db.x.infoTexts.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoTextsNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(db.x.infoTexts)
          .set({ ...row, activityId })
          .where(
            and(
              eq(db.x.infoTexts.id, row.id),
              eq(db.x.infoTexts.activityId, activityId),
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
      .delete(db.x.infoTexts)
      .where(
        and(
          inArray(db.x.infoTexts.id, ids),
          eq(db.x.infoTexts.activityId, activityId),
        ),
      );
  },
};
