import { generateKeyBetween } from "fractional-indexing";
import { type ActivityItemWithChildren } from "~/server/db/schema";

const draftUuid = "00000000-0000-0000-0000-000000000000";

export function createDraftActivityItemWithChildren({
  activityId,
  afterOrderFracIdx,
  itemType,
}: {
  activityId: string;
  afterOrderFracIdx: string | null;
  itemType: "question" | "text" | "image";
}): ActivityItemWithChildren {
  const base = {
    id: draftUuid,
    activityId,
    orderFracIdx: generateKeyBetween(afterOrderFracIdx, null),
    questions: [],
    infoTexts: [],
    infoImages: [],
  };
  switch (itemType) {
    case "question": {
      return {
        ...base,
        questions: [
          {
            id: draftUuid,
            activityItemId: base.id,
            content: "",
            evalKeys: [],
          },
        ],
      };
    }
    case "text": {
      return {
        ...base,
        infoTexts: [
          {
            id: draftUuid,
            activityItemId: base.id,
            content: "",
          },
        ],
      };
    }
    case "image": {
      return {
        ...base,
        infoImages: [
          {
            id: draftUuid,
            activityItemId: base.id,
            url: "",
            textAlternative: "",
          },
        ],
      };
    }
  }
}
