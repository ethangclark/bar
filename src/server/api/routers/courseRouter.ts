import { desc, eq, sql } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export async function getLatestCoursesByType() {
  // This query uses a window function to rank courses within each type
  // based on creation date, then selects the most recent one
  const latestCourses = await db
    .select({
      courseId: dbSchema.courses.id,
      courseTypeId: dbSchema.courses.typeId,
      courseTypeName: dbSchema.courseTypes.name,
      creationDate: dbSchema.courses.creationDate,
    })
    .from(dbSchema.courses)
    .innerJoin(
      dbSchema.courseTypes,
      eq(dbSchema.courses.typeId, dbSchema.courseTypes.id),
    )
    .where(
      sql`(${dbSchema.courses.typeId}, ${dbSchema.courses.creationDate}) in (
        select ${dbSchema.courses.typeId}, max(${dbSchema.courses.creationDate})
        from ${dbSchema.courses}
        group by ${dbSchema.courses.typeId}
      )`,
    )
    .orderBy(desc(dbSchema.courses.creationDate));

  return latestCourses;
}

export const courseRouter = createTRPCRouter({
  available: publicProcedure.query(async () => {
    const latestCourses = await getLatestCoursesByType();
    return {
      latestCourses,
    };
  }),

  enrollments: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const courseEnrollments = await db
      .select()
      .from(dbSchema.courseEnrollments)
      .where(eq(dbSchema.courseEnrollments.userId, userId));

    return courseEnrollments;
  }),
});
