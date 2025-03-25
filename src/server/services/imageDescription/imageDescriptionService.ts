import { getLlmResponse } from "~/server/ai/llm";
import { defaultModel } from "~/server/ai/llm/types";
import { db } from "~/server/db";
import { beginStr, endStr, parseDescription } from "./parseDescription";

async function getAiResponse({
  userId,
  imageDataUrl,
}: {
  userId: string;
  imageDataUrl: string;
}) {
  const response = await getLlmResponse(
    userId,
    {
      model: defaultModel,
      messages: [
        {
          role: "user",
          content: `Following is an image to be used in a tutoring session. Please respond with a description of the image that can be used for blind users. Write ${beginStr} before the description and ${endStr} after the description.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
    },
    db,
  );
  if (response instanceof Error) {
    throw response;
  }
  return response;
}

export async function getImageDescription({
  userId,
  imageDataUrl,
}: {
  userId: string;
  imageDataUrl: string;
}) {
  // const tries = 3;
  // for (let i = 0; i < tries; i++) {
  const response = await getAiResponse({ userId, imageDataUrl });
  const parseResult = parseDescription(response);
  if (parseResult.success) {
    return parseResult.description;
  }
  // }
  throw new Error("Failed to get image description");
}
