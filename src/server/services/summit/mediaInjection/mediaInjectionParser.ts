// src/server/services/summit/mediaInjectionParser.ts
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
  const textOpenCount = (input.match(/<text>/g) ?? []).length;
  const textCloseCount = (input.match(/<\/text>/g) ?? []).length;
  if (textOpenCount !== textCloseCount) {
    return { success: false, reason: "Mismatched <text> tags" };
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

  const tagRegex = /<(text|image|video)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  const results: MediaInjectionData = [];

  while ((match = tagRegex.exec(input)) !== null) {
    const tagType = match[1] as MediaType;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const content = match[2]!;

    if (tagType === "text") {
      results.push({ type: "text", textContent: content });
    } else if (tagType === "image") {
      const trimmed = content.trim();
      const imageNumber = Number(trimmed);
      if (Number.isNaN(imageNumber)) {
        return { success: false, reason: `Invalid image number: "${content}"` };
      }
      const numericId = imageNumberToNumericId(imageNumber);
      if (!possibleImageIds.includes(numericId)) {
        return { success: false, reason: `Invalid image number: "${content}"` };
      }
      results.push({ type: "image", numericId });
    } else if (tagType === "video") {
      const trimmed = content.trim();
      const videoNumber = Number(trimmed);
      if (Number.isNaN(videoNumber)) {
        return { success: false, reason: `Invalid video number: "${content}"` };
      }
      const numericId = videoNumberToNumericId(videoNumber);
      if (!possibleVideoIds.includes(numericId)) {
        return { success: false, reason: `Invalid video number: "${content}"` };
      }
      results.push({ type: "video", numericId });
    }
  }

  return { success: true, data: results };
}
