import { z } from "zod";
import {
  createActivityDescendents,
  deleteActivityDescendents,
  modifyActivityDescendents,
  readActivityDescendents,
  updateActivityDescendents,
} from "~/server/activityDescendents";
import {
  activityDescendentModificationSchema,
  activityDescendentsSchema,
} from "~/server/activityDescendents/types";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { getActivity } from "~/server/services/activityService";

export const activityDescendentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        activityDescendents: activityDescendentsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, activityDescendents } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return createActivityDescendents({
          activityId,
          activityDescendents,
          userId,
          enrolledAs: activity.course.enrolledAs,
          tx,
        });
      });
    }),
  read: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        includeUserIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { activityId, includeUserIds } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return readActivityDescendents({
          activityId,
          userId,
          enrolledAs: activity.course.enrolledAs,
          includeUserIds: includeUserIds ?? [],
          tx,
        });
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        activityDescendents: activityDescendentsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, activityDescendents } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return updateActivityDescendents({
          activityId,
          activityDescendents,
          userId,
          enrolledAs: activity.course.enrolledAs,
          tx,
        });
      });
    }),
  delete: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        activityDescendents: activityDescendentsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, activityDescendents } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return deleteActivityDescendents({
          activityId,
          activityDescendents,
          userId,
          enrolledAs: activity.course.enrolledAs,
          tx,
        });
      });
    }),

  modify: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        activityDescendentModification: activityDescendentModificationSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, activityDescendentModification } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return modifyActivityDescendents({
          activityId,
          activityDescendentModification,
          userId,
          enrolledAs: activity.course.enrolledAs,
          tx,
        });
      });
    }),
});
