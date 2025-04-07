// app/api/video/stream/route.ts

import { eq } from "drizzle-orm";
import { db } from "~/server/db";

const videoIdParam = "videoId";
export type VideoIdParam = typeof videoIdParam;

// TODO: this is insecure. We need to authenticate that the user has access to the video
// via permissions checking on its corresponding activityId (comparable to the other route)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get(videoIdParam);
  if (!videoId) {
    return new Response(
      JSON.stringify({ error: "Missing url query parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const video = await db.query.videos.findFirst({
    where: eq(db.x.videos.id, videoId),
  });
  if (!video) {
    return new Response(JSON.stringify({ error: "Video not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Pass the Range header along if provided
  const headers: { Range?: string } = {};
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    headers.Range = rangeHeader;
  }

  try {
    const responseFromCloudinary = await fetch(video.cloudinarySecureUrl, {
      headers,
    });

    if (!responseFromCloudinary.ok) {
      return new Response(JSON.stringify({ error: "Error fetching video" }), {
        status: responseFromCloudinary.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward specific headers necessary for video streaming
    const responseHeaders = new Headers();
    const headersToForward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ];
    headersToForward.forEach((header) => {
      const value = responseFromCloudinary.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    // Fallback: if accept-ranges isn't provided, set it explicitly
    if (!responseHeaders.has("accept-ranges")) {
      responseHeaders.set("accept-ranges", "bytes");
    }

    return new Response(responseFromCloudinary.body, {
      status: responseFromCloudinary.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error proxying video:", error);
    return new Response(JSON.stringify({ error: "Error fetching video" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
