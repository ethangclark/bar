import { desc, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export async function getLatestCoursesByType() {
  // This query uses a window function to rank courses within each type
  // based on creation date, then selects the most recent one
  const latestCourses = await db
    .select({
      id: dbSchema.courses.id,
      courseTypeId: dbSchema.courses.typeId,
      courseType: {
        id: dbSchema.courseTypes.id,
        name: dbSchema.courseTypes.name,
        creationDate: dbSchema.courses.createdAt,
      },
    })
    .from(dbSchema.courses)
    .innerJoin(
      dbSchema.courseTypes,
      eq(dbSchema.courses.typeId, dbSchema.courseTypes.id),
    )
    .where(
      sql`(${dbSchema.courses.typeId}, ${dbSchema.courses.createdAt}) in (
        select ${dbSchema.courses.typeId}, max(${dbSchema.courses.createdAt})
        from ${dbSchema.courses}
        group by ${dbSchema.courses.typeId}
      )`,
    )
    .orderBy(desc(dbSchema.courses.createdAt));

  return latestCourses;
}
