import { z } from "zod";
import {
  createDescendents,
  deleteDescendents,
  modifyDescendents,
  readDescendents,
  updateDescendents,
} from "~/server/descendents";
import {
  descendentModificationsSchema,
  descendentsSchema,
} from "~/server/descendents/types";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { getActivity } from "~/server/services/activityService";

export const descendentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        descendents: descendentsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, descendents } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return createDescendents({
          activityId,
          descendents,
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
        return readDescendents({
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
        descendents: descendentsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, descendents } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return updateDescendents({
          activityId,
          descendents,
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
        descendents: descendentsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, descendents } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return deleteDescendents({
          activityId,
          descendents,
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
        descendentModifications: descendentModificationsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, descendentModifications } = input;
      const { userId } = ctx;

      const activity = await getActivity({
        assertAccess: true,
        userId,
        activityId,
      });

      return db.transaction(async (tx) => {
        return modifyDescendents({
          activityId,
          descendentModifications,
          userId,
          enrolledAs: activity.course.enrolledAs,
          tx,
        });
      });
    }),
});
