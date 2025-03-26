import { desc } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db, schema } from "~/server/db";

export const adminRouter = createTRPCRouter({
  flags: adminProcedure
    .input(z.object({ lastCount: z.literal(100) }))
    .query(async ({ input }) => {
      const flags = await db.query.flags.findMany({
        limit: input.lastCount,
        orderBy: [desc(schema.flags.createdAt)],
      });
      return flags;
    }),
});
