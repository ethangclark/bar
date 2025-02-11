import { imageNumberToNumericId } from "~/common/idUtils";

export type ImageInjectionResponse =
  | {
      success: true;
      data: Array<
        | { type: "text"; textContent: string }
        | { type: "image"; numericId: number }
      >;
    }
  | { success: false; reason: string };

export function parseImageInjectionResponse(
  input: string,
  possibleNumericIds: number[],
): ImageInjectionResponse {
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

  const tagRegex = /<(text|image)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  const results: Array<
    { type: "text"; textContent: string } | { type: "image"; numericId: number }
  > = [];

  while ((match = tagRegex.exec(input)) !== null) {
    const tagType = match[1];
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
      if (!possibleNumericIds.includes(numericId)) {
        return { success: false, reason: `Invalid image number: "${content}"` };
      }
      results.push({ type: "image", numericId: numericId });
    }
  }

  return { success: true, data: results };
}
