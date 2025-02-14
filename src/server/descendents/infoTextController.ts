import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { type EnrollmentType, isDeveloper } from "~/common/enrollmentTypeUtils";
import { type InfoText } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

function canRead() {
  return true;
}

function canWrite(enrolledAs: EnrollmentType[]) {
  return isDeveloper(enrolledAs);
}

export const infoTextController: DescendentController<InfoText> = {
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
    const infoTexts = await tx
      .insert(db.x.infoTexts)
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
      .from(db.x.infoTexts)
      .where(eq(db.x.infoTexts.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!canWrite(enrolledAs)) {
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
    if (!canWrite(enrolledAs)) {
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
