export type ImageInjectionResponse =
  | {
      success: true;
      data: Array<
        | { type: "text"; textContent: string }
        | { type: "image"; imageNumber: number }
      >;
    }
  | { success: false; reason: string };

export function parseImageInjectionResponse(
  input: string,
): ImageInjectionResponse {
  const textOpenCount = (input.match(/<text>/g) || []).length;
  const textCloseCount = (input.match(/<\/text>/g) || []).length;
  if (textOpenCount !== textCloseCount) {
    return { success: false, reason: "Mismatched <text> tags" };
  }
  const imageOpenCount = (input.match(/<image>/g) || []).length;
  const imageCloseCount = (input.match(/<\/image>/g) || []).length;
  if (imageOpenCount !== imageCloseCount) {
    return { success: false, reason: "Mismatched <image> tags" };
  }

  const tagRegex = /<(text|image)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  const results: Array<
    | { type: "text"; textContent: string }
    | { type: "image"; imageNumber: number }
  > = [];

  while ((match = tagRegex.exec(input)) !== null) {
    const tagType = match[1];
    const content = match[2]!;

    if (tagType === "text") {
      results.push({ type: "text", textContent: content });
    } else if (tagType === "image") {
      const trimmed = content.trim();
      const imageNumber = Number(trimmed);
      if (Number.isNaN(imageNumber)) {
        return { success: false, reason: `Invalid image number: "${content}"` };
      }
      results.push({ type: "image", imageNumber });
    }
  }

  return { success: true, data: results };
}
