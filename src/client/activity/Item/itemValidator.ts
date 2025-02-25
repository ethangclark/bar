import { assertTypesExhausted } from "~/common/assertions";
import { objectKeys } from "~/common/objectUtils";
import {
  type EvalKey,
  type InfoImage,
  type InfoText,
  type InfoVideo,
  type ItemWithDescendents,
  type Question,
} from "~/server/db/schema";

export function isInfoTextDraftReady(draft: InfoText) {
  return draft.content !== "";
}

export function isInfoImageDraftImageReady(draft: InfoImage) {
  return draft.url !== "";
}
export function isInfoImageDraftTextReady(draft: InfoImage) {
  return draft.textAlternative !== "";
}

export function isInfoImageDraftReady(draft: InfoImage) {
  return isInfoImageDraftImageReady(draft) && isInfoImageDraftTextReady(draft);
}

export function isInfoVideoDraftReady(draft: InfoVideo) {
  return draft.textAlternative !== "";
}

export function isQuestionDraftReady(draft: Question) {
  return draft.content !== "";
}
export function isEvalKeyDraftReady(draft: EvalKey | null) {
  return draft !== null && draft.content !== "";
}
export function isQuestionAndKeyDraftReady(
  draft: Question & { evalKey: EvalKey | null },
) {
  if (!isQuestionDraftReady(draft)) {
    return false;
  }
  if (draft.evalKey === null) {
    return true;
  }
  return isEvalKeyDraftReady(draft.evalKey);
}

// we don't actually use this anywhere,
// but it's useful to remind us to add a validator for each descendent type,
// so please don't remove it unless that reminder is no longer needed!
// (Also if you add something to this, be sure to audit uses of existing item validators
// and add usage of the new validator to wherever it's needed based on those uses)
export function isItemWithDescendentsDraftReady(draft: ItemWithDescendents) {
  for (const key of objectKeys(draft)) {
    switch (key) {
      case "id":
      case "activityId":
      case "orderFracIdx":
        continue;
      case "infoText": {
        if (draft.infoText !== null) {
          const isValid = isInfoTextDraftReady(draft.infoText);
          if (!isValid) {
            return false;
          }
        }
        continue;
      }
      case "infoImage": {
        if (draft.infoImage !== null) {
          const isValid = isInfoImageDraftReady(draft.infoImage);
          if (!isValid) {
            return false;
          }
        }
        continue;
      }
      case "infoVideo": {
        if (draft.infoVideo !== null) {
          const isValid = isInfoVideoDraftReady(draft.infoVideo);
          if (!isValid) {
            return false;
          }
        }
        continue;
      }
      case "question": {
        if (draft.question !== null) {
          const evalKey = draft.question.evalKey;
          const isValid = evalKey
            ? isQuestionAndKeyDraftReady({
                ...draft.question,
                evalKey,
              })
            : isQuestionDraftReady(draft.question);
          if (!isValid) {
            return false;
          }
        }
        continue;
      }
      default:
        assertTypesExhausted(key);
    }
  }
  return true;
}
