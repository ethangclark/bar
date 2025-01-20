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
    questionId: null,
    question: null,
    infoTextId: null,
    infoText: null,
    infoImageId: null,
    infoImage: null,
  };
  const childId = Math.random().toString();
  switch (itemType) {
    case "question": {
      return {
        ...base,
        questionId: childId,
        question: {
          id: childId,
          content: "",
        },
      };
    }
    case "text": {
      return {
        ...base,
        infoTextId: childId,
        infoText: {
          id: childId,
          content: "",
        },
      };
    }
    case "image": {
      return {
        ...base,
        infoImageId: childId,
        infoImage: {
          id: childId,
          url: null,
        },
      };
    }
  }
}
