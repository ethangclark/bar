import { cursorColors } from "~/common/utils/constants";
import { failure, isFailure, type Result } from "~/common/utils/result";
import { oneTagContent } from "~/common/utils/xmlUtils";
import { getResponseFromLlm } from "~/server/ai/llm";
import { testLogAsTxt } from "~/server/testLog";

export async function getZoomedCursorClickPosition({
  userId,
  naturalLanguageCommand,
  annotatedPngBuffer,
}: {
  userId: string;
  naturalLanguageCommand: string;
  annotatedPngBuffer: Buffer;
}): Promise<
  Result<{
    offset: { x: number; y: number } | null;
  }>
> {
  const response = await getResponseFromLlm({
    userId,
    messages: [
      {
        type: "text",
        content: `A website user is trying to determine where to click in order to perform the following action:

"""
${naturalLanguageCommand}
"""

Attached is a screenshot from their browser session, with six low-opacity dots showing where they are considering and a zoom tool showing the area under consideration under magnification.

Reply with the color of an area which the user should click to perform the action. Wrap your response in <answer> tags. Here are the options:

${cursorColors.map((color) => `<answer>${color}</answer>`).join("\n")}

If none of the areas are correct, reply with <answer>none</answer>.`,
      },
      {
        type: "png",
        content: annotatedPngBuffer,
      },
    ],
  });

  testLogAsTxt("getCursorClickPosition response", response);

  if (isFailure(response)) {
    return response;
  }

  const tagContent = oneTagContent({ tag: "answer", xml: response.response });
  if (isFailure(tagContent)) {
    return tagContent;
  }

  const responseOptions = ["none", ...cursorColors];

  const cursorColor = responseOptions.find((opt) => opt === tagContent);
  if (!cursorColor) {
    return failure("Invalid click position (code 03a).");
  }

  if (cursorColor === "none") {
    return { offset: null };
  }

  // TODO: the below logic

  const x = cursorColors.indexOf(cursorColor);
  const y = cursorColors.indexOf(cursorColor);

  return { offset: { x, y } };
}
