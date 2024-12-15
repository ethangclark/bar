import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export async function getOpenCourses() {
  return db.query.courses.findMany({
    where: eq(dbSchema.courses.acceptingEnrollments, true),
    with: {
      courseType: true,
    },
  });
}
