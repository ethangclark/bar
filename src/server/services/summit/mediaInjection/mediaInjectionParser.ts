// src/server/services/summit/mediaInjection/mediaInjectionParser.ts
import {
  imageNumberToNumericId,
  videoNumberToNumericId,
} from "~/common/idUtils";

export type MediaType = "image" | "video" | "text";

export type MediaInjectionItem =
  | { type: "text"; textContent: string }
  | { type: "image"; numericId: number }
  | { type: "video"; numericId: number };

export type MediaInjectionData = MediaInjectionItem[];

export type MediaInjectionResponse =
  | { success: true; data: MediaInjectionData }
  | { success: false; reason: string };

export function parseMediaInjectionResponse(
  input: string,
  possibleImageIds: number[],
  possibleVideoIds: number[],
): MediaInjectionResponse {
  // Check for <no-media> tag and return empty array if found
  if (input.includes("<no-media>")) {
    return { success: true, data: [] };
  }

  const imageOpenCount = (input.match(/<image>/g) ?? []).length;
  const imageCloseCount = (input.match(/<\/image>/g) ?? []).length;
  if (imageOpenCount !== imageCloseCount) {
    return { success: false, reason: "Mismatched <image> tags" };
  }

  const videoOpenCount = (input.match(/<video>/g) ?? []).length;
  const videoCloseCount = (input.match(/<\/video>/g) ?? []).length;
  if (videoOpenCount !== videoCloseCount) {
    return { success: false, reason: "Mismatched <video> tags" };
  }

  // Match both image and video tags
  const tagRegex = /<(image|video)>([\s\S]*?)<\/\1>/g;
  const results: MediaInjectionData = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Process the input string sequentially
  while ((match = tagRegex.exec(input)) !== null) {
    // If there's text before this tag, add it as a text item
    if (match.index > lastIndex) {
      const textContent = input.substring(lastIndex, match.index);
      if (textContent) {
        results.push({ type: "text", textContent });
      }
    }

    const tagType = match[1] as "image" | "video";
    if (!match[2]) {
      return { success: false, reason: "No content found for tag" };
    }
    const content = match[2].trim();

    if (tagType === "image") {
      const imageNumber = Number(content);
      if (Number.isNaN(imageNumber)) {
        return { success: false, reason: `Invalid image number: "${content}"` };
      }
      const numericId = imageNumberToNumericId(imageNumber);
      if (!possibleImageIds.includes(numericId)) {
        return { success: false, reason: `Invalid image number: "${content}"` };
      }
      results.push({ type: "image", numericId });
    } else if (tagType === "video") {
      const videoNumber = Number(content);
      if (Number.isNaN(videoNumber)) {
        return { success: false, reason: `Invalid video number: "${content}"` };
      }
      const numericId = videoNumberToNumericId(videoNumber);
      if (!possibleVideoIds.includes(numericId)) {
        return { success: false, reason: `Invalid video number: "${content}"` };
      }
      results.push({ type: "video", numericId });
    }

    // Update lastIndex to after this tag
    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last tag
  if (lastIndex < input.length) {
    const textContent = input.substring(lastIndex);
    if (textContent) {
      results.push({ type: "text", textContent });
    }
  }

  return { success: true, data: results };
}
