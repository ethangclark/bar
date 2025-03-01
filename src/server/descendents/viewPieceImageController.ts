import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type ViewPieceImage } from "~/server/db/schema";
import { schema } from "../db";

const canRead: DescendentController<ViewPieceImage>["canRead"] = (
  viewPieceImage,
  { enrolledAs, userId },
) => {
  return viewPieceImage.userId === userId || isGrader(enrolledAs);
};

export const viewPieceImageController: DescendentController<ViewPieceImage> = {
  canRead,

  async create() {
    throw new Error("Users may not create view piece images");
  },
  // anyone can read a view piece image for themselves
  async read({ activityId, tx, userId, enrolledAs, includeUserIds }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read view piece images for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }
    return tx
      .select()
      .from(schema.viewPieceImages)
      .where(
        and(
          eq(schema.viewPieceImages.activityId, activityId),
          inArray(schema.viewPieceImages.userId, userIds),
        ),
      );
  },
  // view piece images are immutable
  async update() {
    throw new Error("View piece image update not supported");
  },
  // anyone can delete a view piece image for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(schema.viewPieceImages)
      .where(
        and(
          inArray(schema.viewPieceImages.id, ids),
          eq(schema.viewPieceImages.activityId, activityId),
          eq(schema.viewPieceImages.userId, userId),
        ),
      );
  },
};
