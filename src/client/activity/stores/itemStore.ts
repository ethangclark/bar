import { generateKeyBetween } from "fractional-indexing";
import { autorun, makeAutoObservable, runInAction } from "mobx";
import { Status } from "~/client/utils/status";
import { sortByOrderFracIdx } from "~/common/indexUtils";
import {
  type InfoImage,
  type InfoText,
  type InfoVideo,
  type Item,
  type ItemWithDescendents,
  type Question,
} from "~/server/db/schema";
import { type DraftStore } from "./draftStore";
import { type QuestionStore } from "./questionStore";

export class ItemStore {
  private itemIdToTextInfo: { [key: string]: InfoText } = {};
  private itemIdToQuestion: { [key: string]: Question } = {};
  private itemIdToInfoImage: { [key: string]: InfoImage } = {};
  private itemIdToInfoVideo: { [key: string]: InfoVideo } = {};

  constructor(
    private draftStore: DraftStore,
    private questionStore: QuestionStore,
  ) {
    makeAutoObservable(this);
    autorun(() => {
      const infoTexts = this.draftStore.getDrafts("infoTexts");
      const questions = this.draftStore.getDrafts("questions");
      const infoImages = this.draftStore.getDrafts("infoImages");
      const infoVideos = this.draftStore.getDrafts("infoVideos");
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
    const items = this.draftStore.getDrafts("items");
    if (items instanceof Status) {
      return items;
    }
    return sortByOrderFracIdx(items);
  }

  createItem() {
    const items = this.sortedItems;
    if (items instanceof Status) {
      throw new Error("Items are not loaded");
    }
    const item = this.draftStore.createDraft("items", {
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
  getItemWithChildren(item: Item): ItemWithDescendents {
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
