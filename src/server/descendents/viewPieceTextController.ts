import { and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type ViewPieceText } from "~/server/db/schema";
import { type DescendentController } from "~/server/descendents/descendentTypes";
import { db } from "../db";

const canRead: DescendentController<ViewPieceText>["canRead"] = (
  viewPieceText,
  { enrolledAs, userId },
) => {
  return viewPieceText.userId === userId || isGrader(enrolledAs);
};

export const viewPieceTextController: DescendentController<ViewPieceText> = {
  canRead,

  async create({ rows }) {
    if (rows.length === 0) {
      return [];
    }
    throw new Error("Users may not create view piece texts");
  },
  // anyone can read a view piece text for themselves
  async read({ activityId, tx, userId, enrolledAs, includeUserIds }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read view piece texts for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }
    return tx
      .select()
      .from(db.x.viewPieceTexts)
      .where(
        and(
          eq(db.x.viewPieceTexts.activityId, activityId),
          inArray(db.x.viewPieceTexts.userId, userIds),
        ),
      );
  },
  // view piece texts are immutable
  async update({ rows }) {
    if (rows.length > 0) {
      throw new Error("View piece text update not supported");
    }
    return [];
  },
  // anyone can delete a view piece text for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(db.x.viewPieceTexts)
      .where(
        and(
          inArray(db.x.viewPieceTexts.id, ids),
          eq(db.x.viewPieceTexts.activityId, activityId),
          eq(db.x.viewPieceTexts.userId, userId),
        ),
      );
  },
};
