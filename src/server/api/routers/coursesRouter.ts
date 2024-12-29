import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { getOpenCourses } from "~/server/services/course";
import { getEnrollment } from "~/server/services/enrollment";
import { getSeatsRemaining } from "~/server/services/seats";

async function getEnrollments(userId: string) {
  const enrollments = await db.query.enrollments.findMany({
    where: eq(dbSchema.enrollments.userId, userId),
    with: {
      course: {
        with: {
          courseType: true,
        },
      },
    },
  });
  return enrollments;
}

export const coursesRouter = createTRPCRouter({
  available: publicProcedure.query(async () => {
    return getOpenCourses();
  }),

  enrollments: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const enrollments = await getEnrollments(userId);
    return enrollments;
  }),

  availableAndEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [openCourses, enrollments] = await Promise.all([
      getOpenCourses(),
      getEnrollments(userId),
    ]);
    return { openCourses, enrollments };
  }),

  enroll: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const seatsRemaining = await getSeatsRemaining();
      if (seatsRemaining <= 0) {
        throw new Error("No seats remaining");
      }
      const userId = ctx.session.user.id;
      await db.insert(dbSchema.enrollments).values({
        userId,
        courseId: input.courseId,
      });
    }),

  enrollment: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { enrollmentId } = input;
      const enrollment = await getEnrollment({ userId, enrollmentId });
      if (!enrollment) {
        throw new Error("Course enrollment not found");
      }
      return enrollment;
    }),

  courses: publicProcedure.query(async () => {
    const courses = await db.query.courses.findMany({
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
    });
    return courses;
  }),

  courseDetail: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ input }) => {
      const course = await db.query.courses.findFirst({
        where: eq(dbSchema.courses.id, input.courseId),
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
      });
      return course;
    }),
});
