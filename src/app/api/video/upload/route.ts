// app/api/upload/route.ts

import { NextResponse } from "next/server";
import { Readable } from "stream";
import { assertOne } from "~/common/assertions";
import { db } from "~/server/db";

// Cloudinary will auto-configure using process.env.CLOUDINARY_URL
import { v2 as cloudinary } from "cloudinary";

const infoVideoIdParam = "infoVideoId";
export type InfoVideoIdParam = typeof infoVideoIdParam;

// TODO: this is insecure; anyone could overwrite any video using the ID.
// Need to grab the session token and verify that the user has access to the infoVideoId
// (Find the corresponding activityId, load that activity, and do the access check from there)
export async function POST(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const infoVideoId = searchParams.get(infoVideoIdParam);
    if (!infoVideoId) {
      return new Response(
        JSON.stringify({ error: "Missing url query parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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
    const uploadResult = await new Promise<any>((resolve, reject) => {
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
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    console.log("buffer length", audioBuffer.length); // TODO: transcription

    const videos = await db
      .insert(db.x.videos)
      .values({
        infoVideoId: infoVideoId,
        cloudinaryPublicExId: uploadResult.public_id,
        cloudinarySecureUrl: uploadResult.secure_url,
        cloudinaryAudioUrl: audioUrl,
      })
      .returning();
    assertOne(videos);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
