// app/api/video/upload/route.ts

import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { assertOne } from "~/common/assertions";
import { getBaseUrl } from "~/common/urlUtils";
import { env } from "~/env";
import { db, type DbOrTx, schema } from "~/server/db";
import { type Video, videos } from "~/server/db/schema";

const CLOUDFLARE_STREAM_KEY_ID = env.CLOUDFLARE_STREAM_KEY_ID;
const CLOUDFLARE_STREAM_JWK_BASE64 = env.CLOUDFLARE_STREAM_JWK_BASE64;
const CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}`;

const cloudflareHeaders = {
  Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
};
// --- End Cloudflare Configuration ---

const language = "en";

export async function createUploadUrl(userId: string) {
  const videoName = `summit-user-id-${userId}-date-${Date.now()}.mp4`; // Default name

  const apiUrl = `${CLOUDFLARE_API_BASE}/stream/direct_upload`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      // TUS headers for resumable uploads (optional but recommended)
      "Tus-Resumable": "1.0.0",
    },
    body: JSON.stringify({
      maxDurationSeconds: 3600, // Optional: Set max video duration (e.g., 1 hour)
      // --- IMPORTANT Security Settings ---
      // Require signed URLs for viewing this video
      requireSignedURLs: true,
      // Restrict uploads to come from your web app's origin
      allowedOrigins:
        env.NODE_ENV === "production"
          ? [new URL(getBaseUrl()).origin, "dash.cloudflare.com"]
          : undefined,
      // --- Transcript Request ---
      // We will add metadata via the client-side upload library instead
      meta: { name: videoName }, // Basic metadata can be set here too
      // Watermark profile ID (optional)
      // watermark: { uid: 'YOUR_WATERMARK_PROFILE_ID' }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Cloudflare API Error:", errorData);
    throw new Error(`Cloudflare API error: ${response.statusText}`);
  }

  const data = await response.json();

  // The response contains the video UID and the uploadURL
  // The uploadURL includes upload credentials valid for a short time
  const { uploadURL: cloudflareUploadUrl, uid: cloudflareStreamId } = z
    .object({
      result: z.object({
        uploadURL: z.string(),
        uid: z.string(),
      }),
    })
    .parse(data).result;

  await db.insert(schema.pendingVideoUploads).values({
    cloudflareStreamId,
    userId,
  });

  return { cloudflareUploadUrl, cloudflareStreamId };
}

const captionStatusSchema = z.object({
  result: z.object({
    status: z.enum(["inprogress", "ready", "error"]),
  }),
});

const transcriptionWaitRetryInterval = 1000;
const transcriptionWaitMaxTime = 60 * 1000;
const transcriptionWaitMaxAttempts =
  transcriptionWaitMaxTime / transcriptionWaitRetryInterval;

async function beginTranscription(
  cloudflareStreamId: string,
  retryAttempt = 0,
) {
  if (retryAttempt > transcriptionWaitMaxAttempts) {
    throw new Error(
      `Transcription failed after ${retryAttempt} attempts for video ${cloudflareStreamId}`,
    );
  }
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/stream/${cloudflareStreamId}/captions/en/generate`,
    { method: "POST", headers: cloudflareHeaders },
  );

  if (!response.ok) {
    const errorDataRaw = await response.json();
    const errorData = z
      .object({
        errors: z.array(
          z.object({
            code: z.number(),
            message: z.string(),
          }),
        ),
      })
      .parse(errorDataRaw);
    if (errorData.errors.length === 1 && errorData.errors[0]?.code === 10067) {
      // video is not ready yet; wait a bit and try again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await beginTranscription(cloudflareStreamId, retryAttempt + 1);
    }
    console.error(
      `Failed to generate transcription request (${response.status}): ${JSON.stringify(errorData)}`,
    );
    throw new Error(
      `Failed to generate transcription request (${response.status})`,
    );
  }

  const data = await response.json();
  const status = captionStatusSchema.parse(data).result.status;
  switch (status) {
    case "error":
      throw new Error(
        `Transcription failed in initial generation request for video ${cloudflareStreamId}`,
      );
    case "inprogress":
      return { done: false };
    case "ready":
      return { done: true };
  }
}

// Helper function to poll for transcription status
async function pollTranscriptionStatus(
  cloudflareStreamId: string,
): Promise<void> {
  const pollInterval = 2 * 1000; // 2 seconds
  const maxPollDuration = 2 * 60 * 1000; // 2 minutes
  const maxAttempts = maxPollDuration / pollInterval;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `${CLOUDFLARE_API_BASE}/stream/${cloudflareStreamId}/captions/${language}`,
        {
          headers: cloudflareHeaders,
        },
      );

      if (!response.ok) {
        // If status is 404, captions haven't been generated yet, continue polling
        if (response.status === 404) {
          console.log(
            `Transcription status for ${cloudflareStreamId} (attempt ${attempt + 1}/${maxAttempts}): Not found, polling again...`,
          );
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }
        // Handle other errors
        const errorText = await response.text();
        throw new Error(
          `Failed to poll transcription status (${response.status}): ${errorText}`,
        );
      }

      const data: unknown = await response.json();
      const captions = captionStatusSchema.parse(data);

      console.log(
        `Transcription status for ${cloudflareStreamId} (attempt ${attempt + 1}/${maxAttempts}): ${captions.result.status}`,
      );

      if (captions.result.status === "ready") {
        return; // Transcription is ready
      }
      if (captions.result.status === "error") {
        throw new Error(`Transcription failed for video ${cloudflareStreamId}`);
      }

      // If status is 'inprogress' or other non-ready/non-error state, wait and poll again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error(
        `Error polling transcription status for ${cloudflareStreamId}:`,
        error,
      );
      // Decide if you want to retry on specific errors or just throw
      if (attempt === maxAttempts - 1) {
        throw new Error(
          `Transcription polling failed after ${maxAttempts} attempts for video ${cloudflareStreamId}. Last error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval)); // Wait before retrying after an error
    }
  }

  throw new Error(
    `Transcription for video ${cloudflareStreamId} did not become ready after ${maxAttempts} attempts.`,
  );
}

// Helper function to fetch and parse VTT transcript
async function getTranscriptFromVTT(
  cloudflareStreamId: string,
): Promise<string> {
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/stream/${cloudflareStreamId}/captions/${language}/vtt`,
    {
      headers: cloudflareHeaders,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch VTT transcript (${response.status}): ${errorText}`,
    );
  }

  const vttContent = await response.text();

  // Basic VTT parsing: extract text lines, ignore timestamps and metadata
  const lines = vttContent.split("\n");
  const transcriptLines: string[] = [];

  for (const line of lines) {
    // Skip empty lines, VTT header, and cue identifiers/timings
    if (
      line.trim() === "" ||
      line.startsWith("WEBVTT") ||
      line.includes("-->") ||
      /^\d+$/.test(line.trim()) // Skip cue numbers
    ) {
      continue;
    }
    // Assume lines after timing are text content
    transcriptLines.push(line.trim());
  }

  return transcriptLines.join(" ").replace(/<[^>]+>/g, ""); // Join lines and remove potential VTT tags like <v ->
}

export async function processUpload({
  cloudflareStreamId,
  userId,
  tx,
}: {
  cloudflareStreamId: string;
  userId: string;
  tx: DbOrTx;
}) {
  const { done } = await beginTranscription(cloudflareStreamId);
  if (!done) {
    await pollTranscriptionStatus(cloudflareStreamId);
  }
  const transcript = await getTranscriptFromVTT(cloudflareStreamId);

  const insertedVideos = await tx
    .insert(videos)
    .values({ cloudflareStreamId, userId })
    .returning();
  const video = assertOne(insertedVideos);

  await tx
    .delete(schema.pendingVideoUploads)
    .where(
      eq(schema.pendingVideoUploads.cloudflareStreamId, cloudflareStreamId),
    );

  return { videoId: video.id, transcript };
}

export async function generateViewToken({ video }: { video: Video }) {
  const { cloudflareStreamId } = video;
  const expiryTime = Math.floor(Date.now() / 1000) + 72 * 60 * 60; // 72 hours from now
  const headers = {
    alg: "RS256",
    kid: CLOUDFLARE_STREAM_KEY_ID,
  };
  const payload = {
    sub: cloudflareStreamId, // Subject: The video UID
    kid: CLOUDFLARE_STREAM_KEY_ID, // Key ID
    exp: expiryTime, // Expiration timestamp (seconds)
    accessRules: [
      // Define access rules (optional but recommended)
      // { "type": "ip.geoip.country", "action": "allow", "country": ["US", "CA"] }, // Example: Allow only US/CA
      // { "type": "any", "action": "allow" } // Default allow if no specific rules match (usually needed)
    ],
    downloadable: false, // Prevent download button in default player (if desired)
    // 'startTime': Math.floor(Date.now() / 1000), // Optional: Token not valid before this time
  };

  const streamToken = jwt.sign(
    payload,
    JSON.parse(atob(CLOUDFLARE_STREAM_JWK_BASE64)),
    {
      algorithm: "RS256",
      header: headers,
    },
  );

  return { streamToken };
}
