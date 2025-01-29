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
    question: null,
    infoText: null,
    infoImage: null,
  };
  switch (itemType) {
    case "question": {
      return {
        ...base,
        question: {
          id: draftUuid,
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
          id: draftUuid,
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
          id: draftUuid,
          activityItemId: base.id,
          activityId,
          url: "",
          textAlternative: "",
        },
      };
    }
  }
}
