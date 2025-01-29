import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { canViewDevelopmentData } from "~/common/schemas/enrollmentTypeUtils";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { evalKeySchema } from "~/server/db/schema";
import { getActivity } from "~/server/services/activityService";

export const evalKeysRouter = createTRPCRouter({
  modify: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        toCreate: z.array(evalKeySchema),
        toUpdate: z.array(evalKeySchema),
        toDelete: z.array(evalKeySchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { activityId } = input;
      let { toCreate, toUpdate, toDelete } = input;
      const {
        course: { enrolledAs },
      } = await getActivity({
        assertAccess: true,
        userId: ctx.userId,
        activityId: input.activityId,
      });
      if (!canViewDevelopmentData(enrolledAs)) {
        throw new Error("You are not allowed to modify eval keys");
      }
      toCreate = toCreate.filter((ek) => ek.activityId === activityId);
      toUpdate = toUpdate.filter((ek) => ek.activityId === activityId);
      toDelete = toDelete.filter((ek) => ek.activityId === activityId);
      await db.transaction(async (tx) => {
        await tx.insert(db.x.evalKeys).values(toCreate);
        await Promise.all(
          toUpdate.map((ek) =>
            tx
              .update(db.x.evalKeys)
              .set(ek)
              .where(
                and(
                  eq(db.x.evalKeys.id, ek.id),
                  eq(db.x.evalKeys.activityId, activityId),
                ),
              ),
          ),
        );
        await Promise.all(
          toDelete.map((ek) =>
            tx
              .delete(db.x.evalKeys)
              .where(
                and(
                  eq(db.x.evalKeys.id, ek.id),
                  eq(db.x.evalKeys.activityId, activityId),
                ),
              ),
          ),
        );
      });
    }),
});
