import { assertTypesExhausted } from "~/common/assertions";
import { type ErrorScoreParams } from "./types";

export function getVisualXorDescriptionErrorScore(
  params: ErrorScoreParams,
): number {
  if (params.mediaInjections.length === 0) {
    return 0;
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
}
