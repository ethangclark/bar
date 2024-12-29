import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export async function getEnrollment({
  userId,
  enrollmentId,
}: {
  userId: string;
  enrollmentId: string;
}) {
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(dbSchema.enrollments.userId, userId),
      eq(dbSchema.enrollments.id, enrollmentId),
    ),
    with: {
      course: {
        with: {
          courseType: true,
          units: {
            with: {
              modules: {
                with: {
                  topics: true,
                },
              },
            },
          },
        },
      },
      tutoringSessions: true,
    },
  });
  return enrollment ?? null;
}
