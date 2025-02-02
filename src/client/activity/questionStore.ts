import { autorun, makeAutoObservable, runInAction } from "mobx";
import { Status } from "~/common/status";
import { type EvalKey } from "~/server/db/schema";
import { type ActivityStore } from "./activityStore";

export class QuestionStore {
  private questionIdToEvalKey: Record<string, EvalKey> = {};

  constructor(private activityStore: ActivityStore) {
    makeAutoObservable(this);
    autorun(() => {
      const evalKeys = this.activityStore.getDrafts("evalKeys");
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
