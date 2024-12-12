import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";
import { getLatestCoursesByType } from "~/server/services/course";
import { getSeatsRemaining } from "~/server/services/seats";

export const courseRouter = createTRPCRouter({
  available: publicProcedure.query(async () => {
    const latestCourses = await getLatestCoursesByType();
    return {
      latestCourses,
    };
  }),

  enrollments: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
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
      const enrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(dbSchema.enrollments.userId, userId),
          eq(dbSchema.enrollments.id, input.enrollmentId),
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
        },
      });
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
