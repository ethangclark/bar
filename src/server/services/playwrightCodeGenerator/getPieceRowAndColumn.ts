import { annotationCols } from "~/common/utils/constants";
import { failure, isFailure, type Result } from "~/common/utils/result";
import { findFirstNumber } from "~/common/utils/stringUtils";
import { oneTagContent } from "~/common/utils/xmlUtils";
import { getResponseFromLlm } from "~/server/ai/llm";
import { testLogAsTxt } from "~/server/testLog";

export async function getClickCellColumnIdx({
  userId,
  naturalLanguageCommand,
  annotatedPngBuffer,
}: {
  userId: string;
  naturalLanguageCommand: string;
  annotatedPngBuffer: Buffer;
}): Promise<
  Result<{
    columnIdx: number;
  }>
> {
  const response = await getResponseFromLlm({
    userId,
    messages: [
      {
        type: "text",
        content: `Attached is a screenshot from a user. The user is trying to accomplish the following action:

"""
${naturalLanguageCommand}
"""

Given this goal, which circle most closely represents where they should click? Please wrap the number of the correct circle in an "answer" XML tag, like so: <answer>...</answer>.`,
      },
      {
        type: "png",
        content: annotatedPngBuffer,
      },
    ],
  });

  testLogAsTxt("getClickCellColumnIdx response", response);

  if (isFailure(response)) {
    return response;
  }

  const tagContent = oneTagContent({ tag: "answer", xml: response.response });
  if (isFailure(tagContent)) {
    return tagContent;
  }

  const columnNumber = findFirstNumber(tagContent) ?? -Infinity;

  if (!(1 <= columnNumber && columnNumber <= annotationCols)) {
    return failure("Invalid number.");
  }

  const columnIdx = columnNumber - 1;

  return { columnIdx };
}
