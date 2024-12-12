import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { getLatestCoursesByType } from "~/server/services/course";
import { createTutoringSession } from "~/server/services/tutoringSession";

// async function getFirstEmailVerifiedUser() {
//   const user = await db.query.users.findFirst({
//     where: isNotNull(dbSchema.users.emailVerified),
//     orderBy: asc(dbSchema.users.emailVerified),
//   });
//   if (!user) {
//     throw new Error("No email verified users found");
//   }
//   return user;
// }

async function primeSessions() {
  const latestCourses = await getLatestCoursesByType();
  const ethanUser = await db.query.users.findFirst({
    where: eq(dbSchema.users.email, "ethangclark@gmail.com"),
  });
  if (!ethanUser) {
    throw new Error("Ethan user not found");
  }
  for (const course of latestCourses) {
    let enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(dbSchema.enrollments.userId, ethanUser.id),
        eq(dbSchema.enrollments.courseId, course.id),
      ),
    });
    if (!enrollment) {
      console.log("Enrolling Ethan in course", course.courseType.name);
      await db.insert(dbSchema.enrollments).values({
        userId: ethanUser.id,
        courseId: course.id,
      });
      enrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(dbSchema.enrollments.userId, ethanUser.id),
          eq(dbSchema.enrollments.courseId, course.id),
        ),
      });
      if (!enrollment) {
        throw new Error("Failed to enroll Ethan in course");
      }
    }
    const units = await db.query.units.findMany({
      where: eq(dbSchema.units.courseId, course.id),
      with: {
        modules: {
          with: {
            topics: true,
          },
        },
      },
    });
    for (const unit of units) {
      for (const mod of unit.modules) {
        for (const topic of mod.topics) {
          const session = await db.query.tutoringSessions.findFirst({
            where: and(
              eq(dbSchema.tutoringSessions.userId, ethanUser.id),
              eq(dbSchema.tutoringSessions.topicId, topic.id),
            ),
          });
          if (session) {
            continue;
          }
          // pre-create the session
          console.log(
            "Pre-creating session for topic",
            unit.name,
            mod.name,
            topic.name,
          );
          // TODO
          // await createTutoringSession(
          //   {
          //     enrollmentId: enrollment.id,
          //     topicContext: { topic },
          //   },
          //   ethanUser.id,
          // );
        }
      }
    }
  }
}

void primeSessions();
