import { assertTypesExhausted } from "~/common/assertions";
import { getLlmResponse } from "~/server/ai/llm";
import { defaultModel } from "~/server/ai/llm/types";
import { db } from "~/server/db";
import { type ErrorScoreParams } from "./types";

export async function getVisualXorDescriptionOk(
  params: ErrorScoreParams,
): Promise<{ ok: boolean }> {
  if (params.mediaInjections.length === 0) {
    return { ok: true };
  }
  const messageContent = params.baseMessage.content;
  const injectionDataRepr = params.mediaInjections
    .sort((i1, i2) => i1.viewPiece.order - i2.viewPiece.order)
    .map((inj) => {
      switch (inj.type) {
        case "image":
          return `(IMAGE HERE)`;
        case "video":
          return `(VIDEO HERE)`;
        case "text":
          return inj.data.content;
        default:
          assertTypesExhausted(inj);
      }
    })
    .join("\n\n");

  const prompt = `I have a process that uses AI to transform a piece of text that may include image or video descriptions into text with embedded image or video elements. As a part of this, I have designed this process to remove the bulk of the original image or video descriptions, as they are no longer necessary, reworking the content to smoothly express the presence of the image or video without repeating the visual content with a text description.

Here's an example of how the process is meant to work:

(begin example of a good transformation)

INPUT:
We will now move on to item 5. Here is a description of image 1004:

A butane lighter is shown in 3 panels. In the first panel, on the left, the butane fill line is indicated, and it's shown that above the line, butane particles are dispersed, and below the line, they are tightly-packed. In the second panel, on the right, it's shown that the lever was pushed after making sparks, and that a flame has been created and that dispersed water vapor and carbon dioxide particles now exist above the lighter.

Let me know when you are ready to move on.

OUTPUT:
Following is image 1004, which illustrates a butane lighter:

(IMAGE HERE)

Let me know when you're ready to move on.

(end example of a good transformation)

In the case of a good transformation like the one above, reply with "REMOVAL_OK".

Occasionally, this process forgets to remove the bulk of the original description, and includes it in the output. This is annoying to students, as it's redundant with the visual content. Here's an example of the process forgetting to remove the bulk of the original description:

(begin example of a bad transformation)

INPUT:
Let's look at image 1000. The description of this image is: a mitochondrion with details of the mitochondrial membrane and mitochondrial DNA, its folded inner membrane forming the cristae structures. Do you have any questions about it?

OUTPUT:
Following is image 1000:

(IMAGE HERE)

This image shows a mitochondrion with details of the mitochondrial membrane and mitochondrial DNA, its folded inner membrane forming the cristae structures. Do you have any questions about it?

(end example of a bad transformation)

In the case of a bad transformation like the one above, reply with "REMOVAL_NOT_OK".

Alright, here's the transformation I want you to analyze. Remember to reply with "REMOVAL_OK" or "REMOVAL_NOT_OK":

INPUT:
${messageContent}

OUTPUT:
${injectionDataRepr}
`;

  const response = await getLlmResponse(
    params.baseMessage.userId,
    {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: defaultModel,
    },
    db,
  );

  if (response instanceof Error) {
    throw response;
  }

  const ok =
    response.includes("REMOVAL_OK") && !response.includes("REMOVAL_NOT_OK");

  return { ok };
}
