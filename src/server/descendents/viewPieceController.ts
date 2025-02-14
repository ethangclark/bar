import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type ViewPiece } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

const canRead: DescendentController<ViewPiece>["canRead"] = (
  viewPiece,
  { enrolledAs, userId },
) => {
  return viewPiece.userId === userId || isGrader(enrolledAs);
};

export const viewPieceController: DescendentController<ViewPiece> = {
  canRead,

  async create({ rows }) {
    if (rows.length === 0) {
      return [];
    }
    throw new Error("Users may not create view pieces");
  },
  // anyone can read a view piece for themselves
  async read({ activityId, tx, userId, enrolledAs, includeUserIds }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read view pieces for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }
    return tx
      .select()
      .from(db.x.viewPieces)
      .where(
        and(
          eq(db.x.viewPieces.activityId, activityId),
          inArray(db.x.viewPieces.userId, userIds),
        ),
      );
  },
  // view pieces are immutable
  async update({ rows }) {
    if (rows.length > 0) {
      throw new Error("View piece update not supported");
    }
    return [];
  },
  // anyone can delete a view piece for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(db.x.viewPieces)
      .where(
        and(
          inArray(db.x.viewPieces.id, ids),
          eq(db.x.viewPieces.activityId, activityId),
          eq(db.x.viewPieces.userId, userId),
        ),
      );
  },
};
