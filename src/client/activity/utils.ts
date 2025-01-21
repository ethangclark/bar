import { generateKeyBetween } from "fractional-indexing";
import { type ActivityItemWithChildren } from "~/server/db/schema";

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
    id: Math.random().toString(),
    activityId,
    orderFracIdx: generateKeyBetween(afterOrderFracIdx, null),
    questions: [],
    infoTexts: [],
    infoImages: [],
  };
  const childId = Math.random().toString();
  switch (itemType) {
    case "question": {
      return {
        ...base,
        questions: [
          {
            id: childId,
            activityItemId: base.id,
            content: "",
          },
        ],
      };
    }
    case "text": {
      return {
        ...base,
        infoTexts: [
          {
            id: childId,
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
            id: childId,
            activityItemId: base.id,
            url: "",
            textAlternative: "",
          },
        ],
      };
    }
  }
}
