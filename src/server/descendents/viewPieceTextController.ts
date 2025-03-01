import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type ViewPieceText } from "~/server/db/schema";
import { schema } from "../db";

const canRead: DescendentController<ViewPieceText>["canRead"] = (
  viewPieceText,
  { enrolledAs, userId },
) => {
  return viewPieceText.userId === userId || isGrader(enrolledAs);
};

export const viewPieceTextController: DescendentController<ViewPieceText> = {
  canRead,

  async create() {
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
      .from(schema.viewPieceTexts)
      .where(
        and(
          eq(schema.viewPieceTexts.activityId, activityId),
          inArray(schema.viewPieceTexts.userId, userIds),
        ),
      );
  },
  // view piece texts are immutable
  async update() {
    throw new Error("View piece text update not supported");
  },
  // anyone can delete a view piece text for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(schema.viewPieceTexts)
      .where(
        and(
          inArray(schema.viewPieceTexts.id, ids),
          eq(schema.viewPieceTexts.activityId, activityId),
          eq(schema.viewPieceTexts.userId, userId),
        ),
      );
  },
};
