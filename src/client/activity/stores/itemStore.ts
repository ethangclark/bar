import { generateKeyBetween } from "fractional-indexing";
import { autorun, makeAutoObservable, runInAction } from "mobx";
import { Status } from "~/client/utils/status";
import {
  type InfoImage,
  type InfoText,
  type InfoVideo,
  type Item,
  type ItemWithChildren,
  type Question,
} from "~/server/db/schema";
import { type ActivityEditorStore } from "./activityEditorStore";
import { type QuestionStore } from "./questionStore";

export class ItemStore {
  private itemIdToTextInfo: { [key: string]: InfoText } = {};
  private itemIdToQuestion: { [key: string]: Question } = {};
  private itemIdToInfoImage: { [key: string]: InfoImage } = {};
  private itemIdToInfoVideo: { [key: string]: InfoVideo } = {};

  constructor(
    private activityEditorStore: ActivityEditorStore,
    private questionStore: QuestionStore,
  ) {
    makeAutoObservable(this);
    autorun(() => {
      const infoTexts = this.activityEditorStore.getDrafts("infoTexts");
      const questions = this.activityEditorStore.getDrafts("questions");
      const infoImages = this.activityEditorStore.getDrafts("infoImages");
      const infoVideos = this.activityEditorStore.getDrafts("infoVideos");
      runInAction(() => {
        if (
          infoTexts instanceof Status ||
          questions instanceof Status ||
          infoImages instanceof Status ||
          infoVideos instanceof Status
        ) {
          this.itemIdToTextInfo = {};
          this.itemIdToQuestion = {};
          this.itemIdToInfoImage = {};
          this.itemIdToInfoVideo = {};
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
        for (const draft of infoVideos) {
          this.itemIdToInfoVideo[draft.itemId] = draft;
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
  getInfoVideo(itemId: string) {
    const infoVideo = this.itemIdToInfoVideo[itemId];
    if (!infoVideo || infoVideo instanceof Status) {
      return null;
    }
    return infoVideo;
  }
  getItemWithChildren(item: Item): ItemWithChildren {
    const infoText = this.getTextInfo(item.id);
    const infoImage = this.getInfoImage(item.id);
    const infoVideo = this.getInfoVideo(item.id);
    const question = this.getQuestion(item.id);
    return {
      ...item,
      infoText,
      infoImage,
      infoVideo,
      question: question
        ? {
            ...question,
            evalKey: this.questionStore.getEvalKey(question.id),
          }
        : null,
    };
  }
}
