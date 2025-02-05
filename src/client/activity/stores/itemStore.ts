import { autorun, makeAutoObservable, runInAction } from "mobx";
import { Status } from "~/common/status";
import {
  type InfoImage,
  type InfoText,
  type Question,
} from "~/server/db/schema";
import { type ActivityEditorStore } from "./activityEditorStore";
import { generateKeyBetween } from "fractional-indexing";

export class ItemStore {
  private itemIdToTextInfo: Record<string, InfoText> = {};
  private itemIdToQuestion: Record<string, Question> = {};
  private itemIdToInfoImage: Record<string, InfoImage> = {};

  constructor(private activityEditorStore: ActivityEditorStore) {
    makeAutoObservable(this);
    autorun(() => {
      const infoTexts = this.activityEditorStore.getDrafts("infoTexts");
      const questions = this.activityEditorStore.getDrafts("questions");
      const infoImages = this.activityEditorStore.getDrafts("infoImages");
      runInAction(() => {
        if (
          infoTexts instanceof Status ||
          questions instanceof Status ||
          infoImages instanceof Status
        ) {
          this.itemIdToTextInfo = {};
          this.itemIdToQuestion = {};
          this.itemIdToInfoImage = {};
          return;
        }
        for (const draft of infoTexts) {
          this.itemIdToTextInfo[draft.itemId] = draft;
        }
        for (const draft of questions) {
          this.itemIdToQuestion[draft.itemId] = draft;
        }
        for (const draft of infoImages) {
          this.itemIdToInfoImage[draft.itemId] = draft;
        }
      });
    });
  }

  get sortedItems() {
    const items = this.activityEditorStore.getDrafts("items");
    if (items instanceof Status) {
      return items;
    }
    return items
      .slice()
      .sort((a, b) => (a.orderFracIdx < b.orderFracIdx ? -1 : 1));
  }

  createItem() {
    const items = this.sortedItems;
    if (items instanceof Status) {
      throw new Error("Items are not loaded");
    }
    const item = this.activityEditorStore.createDraft("items", {
      orderFracIdx: generateKeyBetween(
        items.slice(-1)[0]?.orderFracIdx ?? null,
        null,
      ),
    });
    return item;
  }

  getTextInfo(itemId: string) {
    const infoText = this.itemIdToTextInfo[itemId];
    if (!infoText || infoText instanceof Status) {
      return null;
    }
    return infoText;
  }
  getQuestion(itemId: string) {
    const question = this.itemIdToQuestion[itemId];
    if (!question || question instanceof Status) {
      return null;
    }
    return question;
  }
  getInfoImage(itemId: string) {
    const infoImage = this.itemIdToInfoImage[itemId];
    if (!infoImage || infoImage instanceof Status) {
      return null;
    }
    return infoImage;
  }
}
