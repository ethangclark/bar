// src/server/services/summit/videoInjectionParser.ts
import { z } from "zod";

const VideoInjectionItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    textContent: z.string(),
  }),
  z.object({
    type: z.literal("video"),
    numericId: z.number(),
  }),
]);

const VideoInjectionDataSchema = z.array(VideoInjectionItemSchema);

export type VideoInjectionItem = z.infer<typeof VideoInjectionItemSchema>;
export type VideoInjectionData = z.infer<typeof VideoInjectionDataSchema>;

export type VideoInjectionResponse =
  | {
      success: true;
      data: VideoInjectionData;
    }
  | {
      success: false;
      reason: string;
    };

export function parseVideoInjectionResponse(
  response: string,
  possibleNumericIds: number[],
): VideoInjectionResponse {
  try {
    // Try to parse the response as JSON
    const parsed = JSON.parse(response);

    // Validate the parsed data against our schema
    const result = VideoInjectionDataSchema.safeParse(parsed);

    if (!result.success) {
      return {
        success: false,
        reason: `Failed to validate response: ${result.error.message}`,
      };
    }

    // Check that all video numericIds are in the list of possible IDs
    const data = result.data;
    for (const item of data) {
      if (
        item.type === "video" &&
        !possibleNumericIds.includes(item.numericId)
      ) {
        return {
          success: false,
          reason: `Video numericId ${item.numericId} is not in the list of possible IDs`,
        };
      }
    }

    return {
      success: true,
      data,
    };
  } catch (e) {
    return {
      success: false,
      reason: `Failed to parse response as JSON: ${String(e)}`,
    };
  }
}
