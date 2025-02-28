import { noop } from "~/common/fnUtils";

type ParseResult =
  | { success: true; description: string }
  | { success: false; reason: string };

export const beginStr = "BEGIN_DESCRIPTION";
export const endStr = "END_DESCRIPTION";

export function parseDescription(response: string): ParseResult {
  const [preChunk, postPreChunk, ...rest1] = response.split(beginStr);
  noop(preChunk);
  if (!postPreChunk || rest1.length > 0) {
    return {
      success: false,
      reason: "Description was not properly formatted (code 1)",
    };
  }
  const [description, ...rest2] = postPreChunk.split(endStr);
  if (!description || rest2.length !== 1) {
    return {
      success: false,
      reason: "Description was not properly formatted (code 2)",
    };
  }
  const trimmedDescription = description.trim();
  if (trimmedDescription.length === 0) {
    return {
      success: false,
      reason: "Description was not properly formatted (code 3)",
    };
  }
  return { success: true, description: trimmedDescription };
}
