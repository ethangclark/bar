import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type ViewPieceImage } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

const canRead: DescendentController<ViewPieceImage>["canRead"] = (
  viewPieceImage,
  { enrolledAs, userId },
) => {
  return viewPieceImage.userId === userId || isGrader(enrolledAs);
};

export const viewPieceImageController: DescendentController<ViewPieceImage> = {
  canRead,

  async create({ rows }) {
    if (rows.length === 0) {
      return [];
    }
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
      .from(db.x.viewPieceImages)
      .where(
        and(
          eq(db.x.viewPieceImages.activityId, activityId),
          inArray(db.x.viewPieceImages.userId, userIds),
        ),
      );
  },
  // view piece images are immutable
  async update({ rows }) {
    if (rows.length > 0) {
      throw new Error("View piece image update not supported");
    }
    return [];
  },
  // anyone can delete a view piece image for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(db.x.viewPieceImages)
      .where(
        and(
          inArray(db.x.viewPieceImages.id, ids),
          eq(db.x.viewPieceImages.activityId, activityId),
          eq(db.x.viewPieceImages.userId, userId),
        ),
      );
  },
};
