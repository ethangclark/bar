import { and, eq, inArray } from "drizzle-orm";
import { type DescendentController } from "~/common/descendentUtils";
import { isDeveloper } from "~/common/enrollmentTypeUtils";
import { type InfoVideo } from "~/server/db/schema";
import { schema } from "../db";

function canRead() {
  return true;
}

export const infoVideoController: DescendentController<InfoVideo> = {
  canRead,
  async create({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    await tx
      .insert(schema.infoVideos)
      .values(rows.map((row) => ({ ...row, activityId })))
      .onConflictDoNothing({ target: [schema.infoVideos.id] });

    // return all info videos corresponding to rows, even if they were not inserted
    // (if we used `.returning()` we would only get the rows that were inserted)
    // REASON: the data flow is different for info videos -- they are not created
    // by the normal descendent flow, but are created by the video upload flow,
    // but we want to maintain interop with the descendent flow
    const createdOrPreExisting = await tx
      .select()
      .from(schema.infoVideos)
      .where(
        inArray(
          schema.infoVideos.id,
          rows.map((row) => row.id),
        ),
      );

    return createdOrPreExisting;
  },
  async read({ activityId, tx }) {
    if (!canRead()) {
      return [];
    }
    return tx
      .select()
      .from(schema.infoVideos)
      .where(eq(schema.infoVideos.activityId, activityId));
  },
  async update({ activityId, enrolledAs, tx, rows }) {
    if (!isDeveloper(enrolledAs)) {
      return [];
    }
    const infoVideosNested = await Promise.all(
      rows.map((row) =>
        tx
          .update(schema.infoVideos)
          .set({ ...row, activityId })
          .where(
            and(
              eq(schema.infoVideos.id, row.id),
              eq(schema.infoVideos.activityId, activityId),
            ),
          )
          .returning(),
      ),
    );
    return infoVideosNested.flat();
  },
  async delete({ activityId, enrolledAs, tx, ids }) {
    if (!isDeveloper(enrolledAs)) {
      return;
    }
    await tx
      .delete(schema.infoVideos)
      .where(
        and(
          inArray(schema.infoVideos.id, ids),
          eq(schema.infoVideos.activityId, activityId),
        ),
      );
  },
};
