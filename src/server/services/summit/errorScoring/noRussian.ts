import { assertTypesExhausted } from "~/common/assertions";
import { type ErrorScoreParams } from "./types";

function includesRussianCharacters(str: string) {
  return /[а-яА-Я]/.test(str);
}

export function getLackOfRussianOk(params: ErrorScoreParams) {
  if (includesRussianCharacters(params.baseMessage.content)) {
    return { ok: false };
  }
  const oks = params.mediaInjections.map((inj) => {
    switch (inj.type) {
      case "image":
        return true;
      case "video":
        return true;
      case "text":
        return !includesRussianCharacters(inj.data.content);
      default:
        assertTypesExhausted(inj);
    }
  });
  return { ok: oks.every((ok) => ok) };
}
