import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type ViewPiece } from "~/server/db/schema";
import { schema } from "../db";

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
      .from(schema.viewPieces)
      .where(
        and(
          eq(schema.viewPieces.activityId, activityId),
          inArray(schema.viewPieces.userId, userIds),
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
      .delete(schema.viewPieces)
      .where(
        and(
          inArray(schema.viewPieces.id, ids),
          eq(schema.viewPieces.activityId, activityId),
          eq(schema.viewPieces.userId, userId),
        ),
      );
  },
};
