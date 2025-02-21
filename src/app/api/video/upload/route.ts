// app/api/upload/route.ts

import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { Readable } from "stream";

// Cloudinary will auto-configure using process.env.CLOUDINARY_URL

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

    // Optionally, save uploadResult and audioUrl to your Postgres DB here

    return NextResponse.json({
      public_id: uploadResult.public_id,
      video_url: uploadResult.secure_url,
      audio_url: audioUrl,
      audio_buffer_length: audioBuffer.length, // example detail
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
