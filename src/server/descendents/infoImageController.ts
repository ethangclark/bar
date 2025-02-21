import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { type InfoImage } from "~/server/db/schema";
import { schema } from "../db";

function canRead() {
  return true;
}

export const infoImageController: DescendentController<InfoImage> = {
  canRead,
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoImages = await tx
      .insert(schema.infoImages)
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
      .from(schema.infoImages)
      .where(eq(schema.infoImages.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoImagesNested = await Promise.all(
      rows.map(
        ({
          numericId: _, // do not set this manually
          ...row
        }) =>
          tx
            .update(schema.infoImages)
            .set({ ...row, activityId })
            .where(
              and(
                eq(schema.infoImages.id, row.id),
                eq(schema.infoImages.activityId, activityId),
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
      .delete(schema.infoImages)
      .where(
        and(
          inArray(schema.infoImages.id, ids),
          eq(schema.infoImages.activityId, activityId),
        ),
      );
  },
};
