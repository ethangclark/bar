import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
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
      id: dbSchema.courses.id,
      courseTypeId: dbSchema.courses.typeId,
      courseType: {
        id: dbSchema.courseTypes.id,
        name: dbSchema.courseTypes.name,
        creationDate: dbSchema.courses.creationDate,
      },
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
    const courseEnrollments = await db.query.courseEnrollments.findMany({
      where: eq(dbSchema.courseEnrollments.userId, userId),
      with: {
        course: {
          with: {
            courseType: true,
          },
        },
      },
    });
    return courseEnrollments;
  }),

  enroll: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await db.insert(dbSchema.courseEnrollments).values({
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
      const courseEnrollment = await db.query.courseEnrollments.findFirst({
        where: and(
          eq(dbSchema.courseEnrollments.userId, userId),
          eq(dbSchema.courseEnrollments.id, input.enrollmentId),
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
      if (!courseEnrollment) {
        throw new Error("Course enrollment not found");
      }
      return courseEnrollment;
    }),
});
