import { generateKeyBetween } from "fractional-indexing";
import { type ActivityItemWithChildren } from "~/server/db/schema";

export function createDraftActivityItemWithChildren({
  activityId,
  afterOrderFracIdx,
  itemType,
}: {
  activityId: string;
  afterOrderFracIdx: string | null;
  itemType: "info" | "question";
}): ActivityItemWithChildren {
  const base = {
    id: Math.random().toString(),
    activityId,
    orderFracIdx: generateKeyBetween(afterOrderFracIdx, null),
    questionId: null,
    question: null,
    infoBlockId: null,
    infoBlock: null,
  };
  const childId = Math.random().toString();
  switch (itemType) {
    case "info": {
      return {
        ...base,
        infoBlockId: childId,
        infoBlock: {
          id: childId,
          content: "",
          infoImageId: null,
          infoImage: null,
        },
      };
    }
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
  }
}
