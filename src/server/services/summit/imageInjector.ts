import { getLlmResponse } from "~/server/ai/llm";
import { db } from "~/server/db";
import {
  type ViewPieceImage,
  type ViewPieceText,
  type Message,
} from "~/server/db/schema";
import {
  type ImageInjectionResponse,
  parseImageInjectionResponse,
} from "./imageInjectionParser";
import { imageInjectorPrompt } from "./imageInjectorPrompt";
import { omissionDisclaimer } from "./summitIntro";
import { assertNever } from "~/common/errorUtils";
import { eq } from "drizzle-orm";
import { inArray } from "drizzle-orm";

async function getInjectionResponse(
  userId: string,
  messages: Message[],
  possibleNumericIds: number[],
): Promise<ImageInjectionResponse> {
  const prompt = imageInjectorPrompt(messages);

  const response = await getLlmResponse(
    userId,
    {
      model: "google/gemini-2.0-flash-thinking-exp:free",
      messages: [{ role: "user", content: prompt }],
    },
    db,
  );
  if (response instanceof Error) {
    throw response;
  }

  const parsed = parseImageInjectionResponse(response, possibleNumericIds);
  if (!parsed.success) {
    console.error(
      `LLM response in ${injectImages.name} that could not be parsed:`,
      response,
    );
  }

  return parsed;
}

export async function getInjectionData(
  userId: string,
  messages: Message[],
  possibleNumericIds: number[],
) {
  let response: ImageInjectionResponse | null = null;
  for (let i = 0; i < 3; i++) {
    response = await getInjectionResponse(userId, messages, possibleNumericIds);
    if (response.success) {
      break;
    }
  }
  if (response === null) {
    throw new Error("Failed to get image injection response");
  }
  if (!response.success) {
    throw new Error(
      `Failed to parse image injection response: ${response.reason}`,
    );
  }

  return response.data;
}

export async function injectImages(messages: Message[]) {
  if (!messages.some((m) => m.content.includes(omissionDisclaimer))) {
    return;
  }
  const [message1] = messages;
  if (!message1) {
    throw new Error("No message to inject images into");
  }
  const { userId, activityId } = message1;

  const possibleNumericIds = (
    await db.query.infoImages.findMany({
      where: eq(db.x.infoImages.activityId, activityId),
    })
  ).map((i) => i.numericId);

  const data = await getInjectionData(userId, messages, possibleNumericIds);

  const numericIds = data
    .map((d) => (d.type === "image" ? d.numericId : null))
    .filter((d): d is number => d !== null);

  const [viewPieces, infoImages] = await Promise.all([
    db
      .insert(db.x.messageViewPiece)
      .values(
        data.map((_, idx) => ({
          messageId: message1.id,
          order: idx + 1,
        })),
      )
      .returning(),
    db.query.infoImages.findMany({
      where: inArray(db.x.infoImages.numericId, numericIds),
    }),
  ]);
  if (
    data.every((datum) => {
      if (datum.type === "image") {
        return infoImages.some((i) => i.numericId === datum.numericId);
      }
      return true;
    })
  ) {
    throw new Error("Failed to find all info images");
  }

  const imagePieceDrafts = Array<ViewPieceImage>();
  const textPieceDrafts = Array<ViewPieceText>();

  data.forEach((datum, idx) => {
    const piece = viewPieces[idx];
    if (!piece) {
      throw new Error("No piece found for datum");
    }
    const dt = datum.type;
    switch (dt) {
      case "text": {
        textPieceDrafts.push({
          id: crypto.randomUUID(),
          viewPieceId: piece.id,
          content: datum.textContent,
        });
        break;
      }
      case "image": {
        const infoImage = infoImages.find(
          (i) => i.numericId === datum.numericId,
        );
        if (!infoImage) {
          throw new Error("Failed to find info image");
        }
        imagePieceDrafts.push({
          id: crypto.randomUUID(),
          viewPieceId: piece.id,
          infoImageId: infoImage.id,
        });
        break;
      }
      default: {
        assertNever(dt);
      }
    }
  });

  const [viewPieceImages, viewPieceTexts] = await Promise.all([
    db.insert(db.x.viewPieceImages).values(imagePieceDrafts).returning(),
    db.insert(db.x.viewPieceText).values(textPieceDrafts).returning(),
  ]);

  console.log("TODO: pass updated artifacts to FE", {
    viewPieces,
    viewPieceImages,
    viewPieceTexts,
  });
}
