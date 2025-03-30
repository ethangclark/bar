import { type ErrorScoreParams } from "./types";
import { getVisualXorDescriptionErrorScore } from "./visualXorDescription";

export async function getErrorScore(params: ErrorScoreParams) {
  const visualXorDescriptionErrorScore =
    getVisualXorDescriptionErrorScore(params);
  return 0 + visualXorDescriptionErrorScore;
}
