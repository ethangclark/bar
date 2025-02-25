// app/api/upload/route.ts

import { eq, notInArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import { assertError, assertOne } from "~/common/assertions";
import { db } from "~/server/db";

// Cloudinary will auto-configure using process.env.CLOUDINARY_URL
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { infoVideos, videos } from "~/server/db/schema";

export type VideoUploadResponse = {
  videoId: string;
};

// Function to clean up orphaned videos
async function cleanupOrphanedVideos() {
  // Find videos that aren't referenced by any infoVideo
  const orphanedVideos = await db.query.videos.findMany({
    where: notInArray(
      videos.id,
      db.select({ id: infoVideos.videoId }).from(infoVideos),
    ),
  });

  // Delete each orphaned video from Cloudinary and the database
  for (const video of orphanedVideos) {
    try {
      await cloudinary.uploader.destroy(video.cloudinaryPublicExId, {
        resource_type: "video",
      });
      console.log(`Deleted Cloudinary asset: ${video.cloudinaryPublicExId}`);

      // Delete from database
      await db.delete(videos).where(eq(videos.id, video.id));
    } catch (error) {
      console.error(`Failed to delete orphaned video ${video.id}:`, error);
      // Continue with other deletions even if one fails
    }
  }
}

// TODO: this is insecure; anyone could overwrite any video using the ID.
// Need to grab the session token and verify that the user has access to the infoVideoId
// (Find the corresponding activityId, load that activity, and do the access check from there)
export async function POST(req: Request): Promise<Response> {
  try {
    // Get form data from the request
    const formData = await req.formData();
    const file = formData.get("video");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 },
      );
    }

    // Convert the uploaded File into a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the video using Cloudinary's upload_stream API
    const uploadResultRaw: unknown = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      const readable = Readable.from(buffer);
      readable.pipe(uploadStream);
    });
    const uploadResult = z
      .object({
        public_id: z.string(),
        secure_url: z.string(),
      })
      .parse(uploadResultRaw);

    const audioUrl = cloudinary.url(uploadResult.public_id, {
      resource_type: "video",
      format: "mp3", // Specify the desired audio format
    });

    // Fetch the audio file and convert to a Buffer
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();

      // throws if no audio track present on the video
      throw new Error(
        `Failed to fetch audio data: ${audioResponse.status} ${audioResponse.statusText}. Error details: ${errorText}`,
      );
    }
    // const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    // console.log("buffer length", audioBuffer.length); // TODO: transcription

    const videos = await db
      .insert(db.x.videos)
      .values({
        cloudinaryPublicExId: uploadResult.public_id,
        cloudinarySecureUrl: uploadResult.secure_url,
        cloudinaryAudioUrl: audioUrl,
      })
      .returning();
    const video = assertOne(videos);

    // Trigger orphaned video cleanup as a side effect without awaiting it
    // This won't block the response
    void cleanupOrphanedVideos();

    return NextResponse.json({
      videoId: video.id,
    } satisfies VideoUploadResponse);
  } catch (error: unknown) {
    assertError(error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
