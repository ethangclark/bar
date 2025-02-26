import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isGrader } from "~/common/enrollmentTypeUtils";
import { type ViewPieceVideo } from "~/server/db/schema";
import { schema } from "../db";

const canRead: DescendentController<ViewPieceVideo>["canRead"] = (
  viewPieceVideo,
  { enrolledAs, userId },
) => {
  return viewPieceVideo.userId === userId || isGrader(enrolledAs);
};

export const viewPieceVideoController: DescendentController<ViewPieceVideo> = {
  canRead,

  async create({ rows }) {
    if (rows.length === 0) {
      return [];
    }
    throw new Error("Users may not create view piece videos");
  },
  // anyone can read a view piece video for themselves
  async read({ activityId, tx, userId, enrolledAs, includeUserIds }) {
    let userIds = [userId];
    if (isGrader(enrolledAs)) {
      // grader can read view piece videos for themselves and for other users
      userIds = [...new Set([userId, ...includeUserIds])];
    }
    return tx
      .select()
      .from(schema.viewPieceVideos)
      .where(
        and(
          eq(schema.viewPieceVideos.activityId, activityId),
          inArray(schema.viewPieceVideos.userId, userIds),
        ),
      );
  },
  // view piece videos are immutable
  async update({ rows }) {
    if (rows.length > 0) {
      throw new Error("View piece video update not supported");
    }
    return [];
  },
  // anyone can delete a view piece video for themselves
  async delete({ activityId, tx, ids, userId }) {
    await tx
      .delete(schema.viewPieceVideos)
      .where(
        and(
          inArray(schema.viewPieceVideos.id, ids),
          eq(schema.viewPieceVideos.activityId, activityId),
          eq(schema.viewPieceVideos.userId, userId),
        ),
      );
  },
};
