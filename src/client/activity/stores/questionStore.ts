import { autorun, makeAutoObservable, runInAction } from "mobx";
import { Status } from "~/common/status";
import { type EvalKey } from "~/server/db/schema";
import { type ActivityEditorStore } from "./activityEditorStore";

export class QuestionStore {
  private questionIdToEvalKey: Record<string, EvalKey> = {};

  constructor(private activityEditorStore: ActivityEditorStore) {
    makeAutoObservable(this);
    autorun(() => {
      const evalKeys = this.activityEditorStore.getDrafts("evalKeys");
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
