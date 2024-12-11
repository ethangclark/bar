import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { dbSchema } from "~/server/db/dbSchema";

export const variantRouter = createTRPCRouter({
  types: publicProcedure
    .input(
      z.object({
        courseTypeId: z.string().nullable(),
      }),
    )
    .query(async ({ input }) => {
      const { courseTypeId } = input;
      if (courseTypeId === null) {
        return [];
      }
      const vts = await db.query.variantTypes.findMany({
        where: eq(dbSchema.variantTypes.courseTypeId, courseTypeId),
        with: {
          options: true,
        },
      });
      return vts;
    }),
});
