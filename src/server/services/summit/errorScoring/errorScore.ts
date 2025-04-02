import { getLackOfRussianOk } from "./noRussian";
import { scores } from "./scores";
import { type ErrorScoreParams } from "./types";
import { getVisualXorDescriptionOk } from "./visualXorDescription";

export async function getErrorScore(params: ErrorScoreParams) {
  const { ok: visualXorDescriptionOk } =
    await getVisualXorDescriptionOk(params);
  const { ok: noRussianOk } = getLackOfRussianOk(params);

  const score =
    0 +
    (visualXorDescriptionOk ? 0 : scores.descriptionRedundantWithVisual) +
    (noRussianOk ? 0 : scores.containsRussian);

  return score;
}
