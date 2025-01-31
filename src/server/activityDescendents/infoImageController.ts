import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { infoImages, type InfoImage } from "~/server/db/schema";
import { type ActivityDescendentController } from "~/server/activityDescendents/types";

export const infoImageService: ActivityDescendentController<InfoImage> = {
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoImage = await tx
      .insert(infoImages)
      .values(rows.map((row) => ({ ...row, activityId })))
      .returning();
    return infoImage;
  },
  async read({ activityId, tx }) {
    return tx
      .select()
      .from(infoImages)
      .where(eq(infoImages.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoImagesNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(infoImages)
          .set({ ...row, activityId })
          .where(
            and(
              eq(infoImages.id, row.id),
              eq(infoImages.activityId, activityId),
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
      .delete(infoImages)
      .where(
        and(inArray(infoImages.id, ids), eq(infoImages.activityId, activityId)),
      );
  },
};
