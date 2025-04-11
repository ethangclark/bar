import { exec } from "child_process";
import { eq } from "drizzle-orm";
import fs from "fs";
import fsp from "fs/promises";
import jwt from "jsonwebtoken";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { promisify } from "util";
import { z } from "zod";
import { assertError, assertOne } from "~/common/assertions";
import { env } from "~/env";
import { db, type DbOrTx, schema } from "~/server/db";
import { type Video, videos } from "~/server/db/schema";
import { transcribeAudioBuffer } from "../ai/stt";

// Promisify exec for async/await usage
const execAsync = promisify(exec);

const CLOUDFLARE_STREAM_KEY_ID = env.CLOUDFLARE_STREAM_KEY_ID;
const CLOUDFLARE_STREAM_PEM_BASE64 = env.CLOUDFLARE_STREAM_PEM_BASE64;
const CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}`;

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
      requireSignedURLs: false, // we can use signed URLs without requiring them
      // // Restrict uploads to come from your web app's origin
      // allowedOrigins:
      //   env.NODE_ENV === "production"
      //     ? [new URL(getBaseUrl()).origin, "dash.cloudflare.com"]
      //     : undefined,
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

const audioDownloadAttemptInterval = 1000;
const audioDownloadMaxPollTime = 1000 * 60;
const audioDownloadMaxAttempts =
  audioDownloadMaxPollTime / audioDownloadAttemptInterval;

async function getAudioBufferFromCloudflareStream(
  cloudflareStreamId: string,
  attempt = 0,
): Promise<{
  audioBuffer: Buffer;
  audioMimeType: string;
}> {
  if (attempt >= audioDownloadMaxAttempts) {
    throw new Error(
      `[${cloudflareStreamId}] Failed to download audio after ${audioDownloadMaxAttempts} attempts`,
    );
  }

  let tempVideoPath: string | null = null;
  let tempAudioPath: string | null = null;
  // Using mp3 for broad compatibility with transcription services
  const audioFormat = "mp3";
  const audioMimeType = "audio/mpeg";
  const uniqueSuffix = `${cloudflareStreamId}_${Date.now()}`;

  try {
    // 1. Get Signed Download URL from Cloudflare API
    // We need to POST to the /downloads endpoint to get temporary signed URLs
    // because requireSignedURLs is true for our videos.
    console.log(
      `[${cloudflareStreamId}] Requesting download URL from Cloudflare...`,
    );
    const downloadInfoUrl = `${CLOUDFLARE_API_BASE}/stream/${cloudflareStreamId}/downloads`;
    const downloadInfoResponse = await fetch(downloadInfoUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!downloadInfoResponse.ok) {
      const errorBody = await downloadInfoResponse.json();

      const parsed = z
        .object({
          errors: z.array(
            z.object({
              code: z.number(),
              message: z.string(),
            }),
          ),
        })
        .safeParse(errorBody);
      if (parsed.success) {
        const [error, ...rest] = parsed.data.errors;
        if (error && rest.length === 0 && error.code === 10005) {
          // video is still processing
          await new Promise((resolve) =>
            setTimeout(resolve, audioDownloadAttemptInterval),
          );
          return getAudioBufferFromCloudflareStream(
            cloudflareStreamId,
            attempt + 1,
          );
        }
      }

      throw new Error(
        `Failed to get download URL from Cloudflare API: ${downloadInfoResponse.status} ${downloadInfoResponse.statusText} - ${JSON.stringify(errorBody)}`,
      );
    }

    const downloadInfo = await downloadInfoResponse.json();
    // Assuming the default MP4 download is what we want
    const downloadUrl = z
      .object({
        result: z.object({
          default: z.object({ url: z.string().url() }),
        }),
      })
      .parse(downloadInfo).result.default.url;
    console.log(`[${cloudflareStreamId}] Received download URL.`);

    // 2. Download the video file to a temporary location
    tempVideoPath = path.join("/tmp", `video_${uniqueSuffix}.mp4`);
    console.log(
      `[${cloudflareStreamId}] Downloading video to ${tempVideoPath}...`,
    );
    const videoResponse = await fetch(downloadUrl);
    if (!videoResponse.ok) {
      if (videoResponse.status === 404) {
        // video is still processing
        await new Promise((resolve) =>
          setTimeout(resolve, audioDownloadAttemptInterval),
        );
        return getAudioBufferFromCloudflareStream(
          cloudflareStreamId,
          attempt + 1,
        );
      }
      const body = await videoResponse.text();
      console.error(
        `[${cloudflareStreamId}] Failed to download video file: ${videoResponse.status} ${videoResponse.statusText} - ${body}`,
      );
      throw new Error(
        `Failed to download video file: ${videoResponse.status} ${videoResponse.statusText}`,
      );
    }
    if (!videoResponse.body) {
      throw new Error("Video response body is null");
    }

    // Use pipeline to connect the web stream to the file stream
    const fileStream = fs.createWriteStream(tempVideoPath);
    // Cast response.body to the expected Web Stream type for fromWeb
    const webReadableStream = videoResponse.body;
    // Convert the Web ReadableStream to a Node.js Readable stream
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeReadableStream = Readable.fromWeb(webReadableStream as any);

    // Pipe the Node.js readable stream to the file writable stream
    // pipeline handles stream errors and cleanup automatically
    await pipeline(nodeReadableStream, fileStream);
    // --- MODIFICATION END ---

    console.log(`[${cloudflareStreamId}] Video downloaded successfully.`);

    tempAudioPath = path.join("/tmp", `audio_${uniqueSuffix}.${audioFormat}`);
    const ffmpegCommand = `ffmpeg -i "${tempVideoPath}" -vn -acodec libmp3lame -ab 192k -y "${tempAudioPath}"`;
    console.log(
      `[${cloudflareStreamId}] Running ffmpeg command: ${ffmpegCommand}`,
    );

    try {
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      // More robust stderr check: Log if it's not empty and doesn't *only* contain typical progress info
      const relevantStderr = stderr
        .split("\n")
        .filter(
          (line) =>
            line.trim() !== "" &&
            !line.startsWith("ffmpeg version") &&
            !line.startsWith("Input #") &&
            !line.startsWith("Output #") &&
            !line.startsWith("Stream mapping") &&
            !line.startsWith("frame=") &&
            !line.startsWith("size=") &&
            !line.startsWith("video:") && // Ignore final 'video:0kB' line
            !line.startsWith("audio:") && // Ignore final 'audio:...' line
            !line.startsWith("subtitle:") && // Ignore final 'subtitle:0kB' line
            !line.startsWith("global headers:") && // Ignore final 'global headers:' line
            !line.includes("Press [q] to stop"),
        )
        .join("\n");

      if (relevantStderr) {
        console.warn(
          `[${cloudflareStreamId}] ffmpeg stderr:\n${relevantStderr}`,
        );
      }
      // Log stdout only if it contains something unexpected
      if (stdout && stdout.trim() !== "") {
        console.log(`[${cloudflareStreamId}] ffmpeg stdout: ${stdout}`);
      }
    } catch (error) {
      assertError(error);
      console.error(`[${cloudflareStreamId}] ffmpeg execution failed:`, error);
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        `ffmpeg failed to extract audio: ${error.message} (stderr: ${(error as any).stderr})`,
      );
    }

    console.log(`[${cloudflareStreamId}] Audio extracted to ${tempAudioPath}.`);

    console.log(`[${cloudflareStreamId}] Reading audio file into buffer...`);
    const audioBuffer = await fsp.readFile(tempAudioPath);
    console.log(`[${cloudflareStreamId}] Audio buffer created.`);

    return { audioBuffer, audioMimeType };
  } catch (error) {
    console.error(
      `[${cloudflareStreamId}] Error in getAudioBufferFromCloudflareStream:`,
      error,
    );
    throw error;
  } finally {
    console.log(`[${cloudflareStreamId}] Cleaning up temporary files...`);
    // Use Promise.allSettled for cleanup to ensure both attempts run
    const cleanupResults = await Promise.allSettled([
      tempVideoPath ? fsp.unlink(tempVideoPath) : Promise.resolve(),
      tempAudioPath ? fsp.unlink(tempAudioPath) : Promise.resolve(),
    ]);
    cleanupResults.forEach((result, index) => {
      const filePath = index === 0 ? tempVideoPath : tempAudioPath;
      if (result.status === "rejected" && filePath) {
        console.error(
          `[${cloudflareStreamId}] Failed to delete temporary file ${filePath}:`,
          result.reason,
        );
      } else if (result.status === "fulfilled" && filePath) {
        console.log(`[${cloudflareStreamId}] Deleted temp file: ${filePath}`);
      }
    });
  }
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
  const { audioBuffer, audioMimeType } =
    await getAudioBufferFromCloudflareStream(cloudflareStreamId);

  const { transcript } = await transcribeAudioBuffer(
    audioBuffer,
    audioMimeType,
  );

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

  const privateKeyPEM = Buffer.from(
    CLOUDFLARE_STREAM_PEM_BASE64,
    "base64",
  ).toString("utf8");

  const streamToken = jwt.sign(payload, privateKeyPEM, {
    algorithm: "RS256",
    header: headers,
  });

  return { streamToken };
}
