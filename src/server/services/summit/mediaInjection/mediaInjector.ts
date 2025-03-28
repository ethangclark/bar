// src/server/services/summit/mediaInjector.ts
import { eq, inArray } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import {
  type Message,
  type MessageWithDescendents,
  type ViewPieceImage,
  type ViewPieceText,
  type ViewPieceVideo,
} from "~/server/db/schema";
import {
  imageOmissionDisclaimer,
  videoOmissionDisclaimer,
} from "../summitIntro";
import { getMediaInjectionData } from "./mediaInjectionDataGetter";

export async function injectMedia(
  assistantResponse: Message,
  prevMessages: MessageWithDescendents[],
): Promise<{ hasViewPieces: boolean }> {
  // nothing to do if there are no media to inject
  const hasImages = prevMessages.some((m) =>
    m.content.includes(imageOmissionDisclaimer),
  );
  const hasVideos = prevMessages.some((m) =>
    m.content.includes(videoOmissionDisclaimer),
  );

  if (!hasImages && !hasVideos) {
    return { hasViewPieces: false };
  }

  const { userId, activityId } = assistantResponse;

  const [possibleImageIds, possibleVideoIds] = await Promise.all([
    db.query.infoImages
      .findMany({
        where: eq(schema.infoImages.activityId, activityId),
      })
      .then((images) => images.map((i) => i.numericId)),

    db.query.infoVideos
      .findMany({
        where: eq(schema.infoVideos.activityId, activityId),
      })
      .then((videos) => videos.map((v) => v.numericId)),
  ]);

  const data = await getMediaInjectionData(
    userId,
    assistantResponse,
    prevMessages,
    possibleImageIds,
    possibleVideoIds,
  );

  if (data.length === 0) {
    return { hasViewPieces: false };
  }

  const imageNumericIds = data
    .filter(
      (d): d is { type: "image"; numericId: number } => d.type === "image",
    )
    .map((d) => d.numericId);

  const videoNumericIds = data
    .filter(
      (d): d is { type: "video"; numericId: number } => d.type === "video",
    )
    .map((d) => d.numericId);

  const [viewPieces, infoImages, infoVideos] = await Promise.all([
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

    imageNumericIds.length > 0
      ? db.query.infoImages.findMany({
          where: inArray(schema.infoImages.numericId, imageNumericIds),
        })
      : Promise.resolve([]),

    videoNumericIds.length > 0
      ? db.query.infoVideos.findMany({
          where: inArray(schema.infoVideos.numericId, videoNumericIds),
        })
      : Promise.resolve([]),
  ]);

  // Validate that all referenced media exists
  if (
    !data.every((datum) => {
      if (datum.type === "image") {
        return infoImages.some((i) => i.numericId === datum.numericId);
      }
      if (datum.type === "video") {
        return infoVideos.some((v) => v.numericId === datum.numericId);
      }
      return true;
    })
  ) {
    throw new Error("Failed to find all referenced media");
  }

  const imagePieceDrafts = Array<ViewPieceImage>();
  const videoPieceDrafts = Array<ViewPieceVideo>();
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
      case "video": {
        const infoVideo = infoVideos.find(
          (v) => v.numericId === datum.numericId,
        );
        if (!infoVideo) {
          throw new Error("Failed to find info video");
        }
        videoPieceDrafts.push({
          id: crypto.randomUUID(),
          viewPieceId: viewPiece.id,
          infoVideoId: infoVideo.id,
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

  const [viewPieceImages, viewPieceVideos, viewPieceTexts] = await Promise.all([
    imagePieceDrafts.length > 0
      ? db.insert(schema.viewPieceImages).values(imagePieceDrafts).returning()
      : Promise.resolve([]),

    videoPieceDrafts.length > 0
      ? db.insert(schema.viewPieceVideos).values(videoPieceDrafts).returning()
      : Promise.resolve([]),

    textPieceDrafts.length > 0
      ? db.insert(schema.viewPieceTexts).values(textPieceDrafts).returning()
      : Promise.resolve([]),
  ]);

  const descendents = {
    ...createEmptyDescendents(),
    viewPieces,
    viewPieceImages,
    viewPieceVideos,
    viewPieceTexts,
  };
  await descendentPubSub.publish(descendents);

  return { hasViewPieces: true };
}
