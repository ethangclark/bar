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
    id: crypto.randomUUID(),
    activityId,
    orderFracIdx: generateKeyBetween(afterOrderFracIdx, null),
    question: null,
    infoText: null,
    infoImage: null,
  };
  switch (itemType) {
    case "question": {
      return {
        ...base,
        question: {
          id: crypto.randomUUID(),
          activityItemId: base.id,
          activityId,
          content: "",
        },
      };
    }
    case "text": {
      return {
        ...base,
        infoText: {
          id: crypto.randomUUID(),
          activityItemId: base.id,
          activityId,
          content: "",
        },
      };
    }
    case "image": {
      return {
        ...base,
        infoImage: {
          id: crypto.randomUUID(),
          activityItemId: base.id,
          activityId,
          url: "",
          textAlternative: "",
        },
      };
    }
  }
}
