import { eq, inArray } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import {
  type Message,
  type ViewPieceImage,
  type ViewPieceText,
} from "~/server/db/schema";
import { getInjectionData } from "./injectionDataGetter";
import { imageOmissionDisclaimer } from "./summitIntro";

export async function injectImages(
  assistantResponse: Message,
  allMessages: Message[],
) {
  // nothing to do if there are no images to inject
  if (!allMessages.some((m) => m.content.includes(imageOmissionDisclaimer))) {
    return;
  }

  const { userId, activityId } = assistantResponse;

  const possibleNumericIds = (
    await db.query.infoImages.findMany({
      where: eq(schema.infoImages.activityId, activityId),
    })
  ).map((i) => i.numericId);

  const data = await getInjectionData(userId, allMessages, possibleNumericIds);

  const numericIds = data
    .map((d) => (d.type === "image" ? d.numericId : null))
    .filter((d): d is number => d !== null);

  if (data.length === 0) {
    return;
  }

  const [viewPieces, infoImages] = await Promise.all([
    db
      .insert(schema.viewPieces)
      .values(
        data.map((_, idx) => ({
          messageId: assistantResponse.id,
          order: idx + 1,
          activityId,
          userId,
        })),
      )
      .returning(),
    db.query.infoImages.findMany({
      where: inArray(schema.infoImages.numericId, numericIds),
    }),
  ]);
  if (
    !data.every((datum) => {
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
    const viewPiece = viewPieces[idx];
    if (!viewPiece) {
      throw new Error("No piece found for datum");
    }
    const dt = datum.type;
    switch (dt) {
      case "text": {
        textPieceDrafts.push({
          id: crypto.randomUUID(),
          viewPieceId: viewPiece.id,
          content: datum.textContent,
          activityId,
          userId,
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
          viewPieceId: viewPiece.id,
          infoImageId: infoImage.id,
          activityId,
          userId,
        });
        break;
      }
      default: {
        assertTypesExhausted(dt);
      }
    }
  });

  const [viewPieceImages, viewPieceTexts] = await Promise.all([
    db.insert(schema.viewPieceImages).values(imagePieceDrafts).returning(),
    db.insert(schema.viewPieceTexts).values(textPieceDrafts).returning(),
  ]);

  const descendents = {
    ...createEmptyDescendents(),
    viewPieces,
    viewPieceImages,
    viewPieceTexts,
  };
  await descendentPubSub.publish(descendents);
}
