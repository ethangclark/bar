import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { videos } from "~/server/db/schema";
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
        activityId: z.string().nullable(),
        videoId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activityId, videoId } = input;
      const { user } = ctx;

      const video = await db.query.videos.findFirst({
        where: eq(videos.id, videoId),
      });
      if (!video) {
        throw new Error("Video not found");
      }
      if (video.activityId) {
        if (activityId !== video.activityId) {
          throw new Error("Video not found");
        }
        await getActivity({ user, activityId, assertAccess: true });
      }
      return generateViewToken({ video });
    }),
});
