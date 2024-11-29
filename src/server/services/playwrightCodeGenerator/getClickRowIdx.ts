import { annotationRows } from "~/common/utils/constants";
import { failure, isFailure, type Result } from "~/common/utils/result";
import { findFirstNumber } from "~/common/utils/stringUtils";
import { oneTagContent } from "~/common/utils/xmlUtils";
import { getResponseFromLlm } from "~/server/ai/llm";
import { testLogAsTxt } from "~/server/testLog";

export async function getClickRowIdx({
  userId,
  naturalLanguageCommand,
  annotatedPngBuffer,
}: {
  userId: string;
  naturalLanguageCommand: string;
  annotatedPngBuffer: Buffer;
}): Promise<
  Result<{
    rowIdx: number;
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

Given this goal, and which row contains the elements that they should click? (If there are multiple rows that could work, just pick one.) Please wrap the number of the correct circle in an "answer" XML tag, like so: <answer>...</answer>.`,
      },
      {
        type: "png",
        content: annotatedPngBuffer,
      },
    ],
  });

  testLogAsTxt("getClickRowIdx result", response);

  if (isFailure(response)) {
    return response;
  }

  const tagContent = oneTagContent({ tag: "answer", xml: response.response });
  if (isFailure(tagContent)) {
    return tagContent;
  }

  const rowNumber = findFirstNumber(tagContent) ?? -Infinity;

  if (!(1 <= rowNumber && rowNumber <= annotationRows)) {
    return failure("Invalid number.");
  }

  const rowIdx = rowNumber - 1;

  return { rowIdx };
}
