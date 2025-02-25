// src/server/services/summit/videoInjector.ts
import { eq, inArray } from "drizzle-orm";
import { assertTypesExhausted } from "~/common/assertions";
import { createEmptyDescendents } from "~/common/descendentUtils";
import { db, schema } from "~/server/db";
import { descendentPubSub } from "~/server/db/pubsub/descendentPubSub";
import {
  type Message,
  type ViewPieceText,
  type ViewPieceVideo,
} from "~/server/db/schema";
import { videoOmissionDisclaimer } from "./summitIntro";
import { getVideoInjectionData } from "./videoInjectionDataGetter";

export async function injectVideos(
  assistantResponse: Message,
  allMessages: Message[],
) {
  // nothing to do if there are no videos to inject
  if (!allMessages.some((m) => m.content.includes(videoOmissionDisclaimer))) {
    return;
  }

  const { userId, activityId } = assistantResponse;

  const possibleNumericIds = (
    await db.query.infoVideos.findMany({
      where: eq(schema.infoVideos.activityId, activityId),
    })
  ).map((v) => v.numericId);

  const data = await getVideoInjectionData(
    userId,
    allMessages,
    possibleNumericIds,
  );

  const numericIds = data
    .map((d) => (d.type === "video" ? d.numericId : null))
    .filter((d): d is number => d !== null);

  if (data.length === 0) {
    return;
  }

  const [viewPieces, infoVideos] = await Promise.all([
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
    db.query.infoVideos.findMany({
      where: inArray(schema.infoVideos.numericId, numericIds),
    }),
  ]);
  if (
    !data.every((datum) => {
      if (datum.type === "video") {
        return infoVideos.some((v) => v.numericId === datum.numericId);
      }
      return true;
    })
  ) {
    throw new Error("Failed to find all info videos");
  }

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

  const [viewPieceVideos, viewPieceTexts] = await Promise.all([
    db.insert(schema.viewPieceVideos).values(videoPieceDrafts).returning(),
    db.insert(schema.viewPieceTexts).values(textPieceDrafts).returning(),
  ]);

  const descendents = {
    ...createEmptyDescendents(),
    viewPieces,
    viewPieceVideos,
    viewPieceTexts,
  };
  await descendentPubSub.publish(descendents);
}
