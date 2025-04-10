import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { infoVideos } from "~/server/db/schema";
import { getActivity } from "~/server/services/activity/activityService";
import {
  createUploadUrl,
  generateViewToken,
  processUpload,
} from "~/server/services/cloudflareService";

export const videoRouter = createTRPCRouter({
  createUploadUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await createUploadUrl(ctx.userId);
    return result;
  }),
  processUpload: protectedProcedure
    .input(
      z.object({
        cloudflareStreamId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { cloudflareStreamId } = input;
      return db.transaction(async (tx) => {
        const result = await processUpload({
          cloudflareStreamId,
          userId: ctx.userId,
          tx,
        });
        return result;
      });
    }),
  generateViewToken: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        infoVideoId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, infoVideoId } = input;
      const { user } = ctx;
      await getActivity({ user, activityId, assertAccess: true });
      const infoVideo = await db.query.infoVideos.findFirst({
        where: and(
          eq(infoVideos.id, infoVideoId),
          eq(infoVideos.activityId, activityId),
        ),
        with: {
          video: true,
        },
      });
      if (!infoVideo) {
        throw new Error("Info video not found");
      }
      return generateViewToken({ video: infoVideo.video });
    }),
});
