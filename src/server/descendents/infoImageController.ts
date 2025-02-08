import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { type InfoImage } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/types";
import { db } from "../db";

export const infoImageController: DescendentController<InfoImage> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoImages = await tx
      .insert(db.x.infoImages)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return infoImages;
  },
  async read({ activityId, tx }) {
    return tx
      .select()
      .from(db.x.infoImages)
      .where(eq(db.x.infoImages.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoImagesNested = await Promise.all(
      rows.map((row) =>
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
    if (!isDeveloper(enrolledAs)) {
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
