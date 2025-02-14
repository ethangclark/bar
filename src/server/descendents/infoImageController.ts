import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { type EnrollmentType, isDeveloper } from "~/common/enrollmentTypeUtils";
import { type InfoImage } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

function canRead() {
  return true;
}

function canWrite(enrolledAs: EnrollmentType[]) {
  return isDeveloper(enrolledAs);
}

export const infoImageController: DescendentController<InfoImage> = {
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
    const infoImages = await tx
      .insert(db.x.infoImages)
      .values(
        rows.map(
          ({
            numericId: _, // do not set this manually
            ...row
          }) => ({
            ...row,
            activityId,
          }),
        ),
      )
      .returning();
    return infoImages;
  },
  async read({ activityId, tx }) {
    if (!canRead()) {
      return [];
    }
    return tx
      .select()
      .from(db.x.infoImages)
      .where(eq(db.x.infoImages.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!canWrite(enrolledAs)) {
      return [];
    }
    const infoImagesNested = await Promise.all(
      rows.map(
        ({
          numericId: _, // do not set this manually
          ...row
        }) =>
          tx
            .update(db.x.infoImages)
            .set({ ...row, activityId })
            .where(
              and(
                eq(db.x.infoImages.id, row.id),
                eq(db.x.infoImages.activityId, activityId),
              ),
            )
            .returning(),
      ),
    );
    return infoImagesNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!canWrite(enrolledAs)) {
      return;
    }
    await tx
      .delete(db.x.infoImages)
      .where(
        and(
          inArray(db.x.infoImages.id, ids),
          eq(db.x.infoImages.activityId, activityId),
        ),
      );
  },
};
