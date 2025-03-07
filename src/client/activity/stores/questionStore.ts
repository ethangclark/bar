import { autorun, makeAutoObservable, runInAction } from "mobx";
import { Status } from "~/client/utils/status";
import { type EvalKey } from "~/server/db/schema";
import { type DraftStore } from "./draftStore";

export class QuestionStore {
  private questionIdToEvalKey: { [key: string]: EvalKey } = {};

  constructor(private draftStore: DraftStore) {
    makeAutoObservable(this);
    autorun(() => {
      const evalKeys = this.draftStore.getDrafts("evalKeys");
      runInAction(() => {
        if (evalKeys instanceof Status) {
          this.questionIdToEvalKey = {};
          return;
        }
        for (const draft of evalKeys) {
          this.questionIdToEvalKey[draft.questionId] = draft;
        }
      });
    });
  }

  getEvalKey(questionId: string) {
    const evalKey = this.questionIdToEvalKey[questionId];
    if (!evalKey || evalKey instanceof Status) {
      return null;
    }
    return evalKey;
  }
}
