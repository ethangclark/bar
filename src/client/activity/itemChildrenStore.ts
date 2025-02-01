import { autorun, makeAutoObservable } from "mobx";
import { Status } from "~/common/status";
import {
  type InfoImage,
  type InfoText,
  type Question,
} from "~/server/db/schema";
import { type ActivityEditorStore } from "./activityEditorStore";

export class ItemChildrenStore {
  private itemIdToTextInfo: Record<string, InfoText> = {};
  private itemIdToQuestion: Record<string, Question> = {};
  private itemIdToInfoImage: Record<string, InfoImage> = {};

  constructor(private activityEditorStore: ActivityEditorStore) {
    makeAutoObservable(this);
    autorun(() => {
      const infoTexts = this.activityEditorStore.getDrafts("infoTexts");
      const questions = this.activityEditorStore.getDrafts("questions");
      const infoImages = this.activityEditorStore.getDrafts("infoImages");
      console.log(infoTexts, questions, infoImages);
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
        this.itemIdToTextInfo[draft.activityItemId] = draft;
      }
      for (const draft of questions) {
        this.itemIdToQuestion[draft.activityItemId] = draft;
      }
      for (const draft of infoImages) {
        this.itemIdToInfoImage[draft.activityItemId] = draft;
      }
    });
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
