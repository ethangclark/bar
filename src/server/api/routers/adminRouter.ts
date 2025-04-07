import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { userBasicSchema, type UserBasic } from "~/common/types";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db, schema } from "~/server/db";

export const adminRouter = createTRPCRouter({
  flags: adminProcedure
    .input(z.object({ lastCount: z.literal(100) }))
    .query(async ({ input }) => {
      const flags = await db.query.flags.findMany({
        limit: input.lastCount,
        orderBy: [desc(schema.flags.createdAt)],
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              isInstructor: true,
              requestedInstructorAccess: true,
              isAdmin: true,
            } satisfies { [key in keyof UserBasic]: true },
          },
        },
      });
      return flags;
    }),
  toggleFlag: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const flag = await db.query.flags.findFirst({
        where: eq(schema.flags.id, input.id),
      });
      if (!flag) {
        throw new Error("Flag not found");
      }
      await db
        .update(schema.flags)
        .set({
          adminChecked: !flag.adminChecked,
        })
        .where(eq(schema.flags.id, input.id));
    }),
  users: adminProcedure.query(async () => {
    const users = await db.query.users.findMany();
    return users.map((user) => userBasicSchema.parse(user));
  }),
});
