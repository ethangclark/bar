import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { noop } from "~/common/fnUtils";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db, schema } from "~/server/db";

async function getRecentErrorsCount(params: {
  userId: string | null;
  ipAddress: string;
}) {
  const { userId, ipAddress } = params;
  // Use SQL to calculate the timestamp for one hour ago.
  const oneHourAgo = sql`NOW() - INTERVAL '1 hour'`;

  // Build the condition: filter by userId if provided, otherwise by ipAddress.
  const condition = userId
    ? eq(schema.errors.userId, userId)
    : eq(schema.errors.ipAddress, ipAddress);

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.errors)
    .where(and(sql`${schema.errors.createdAt} > ${oneHourAgo}`, condition));

  return result[0]?.count ?? 0;
}

export const errorRouter = createTRPCRouter({
  recordError: publicProcedure
    .input(
      z.object({
        message: z.string(),
        detailsSuperJsonString: z.string(),
      }),
    )
    .mutation(
      async ({
        input: { message, detailsSuperJsonString },
        ctx: { ipAddress, userId },
      }) => {
        const recentErrorsCount = await getRecentErrorsCount({
          userId,
          ipAddress,
        });

        if (recentErrorsCount > 10) {
          // prevent spamming
          return noop();
        }

        const thirtyDaysAgo = sql`NOW() - INTERVAL '30 days'`;
        void db
          .delete(schema.errors)
          .where(sql`${schema.errors.createdAt} < ${thirtyDaysAgo}`);

        await db.insert(schema.errors).values({
          message,
          detailsSuperJsonString,
          userId,
          ipAddress,
        });
      },
    ),
});
