import { autorun, makeAutoObservable, observable } from "mobx";
import { type ActivityEditorStore } from "./activityEditorStore";
import { type EvalKey } from "~/server/db/schema";
import { Status } from "~/common/utils/status";

export class EvalKeyStore {
  public draftQuestionIdToEvalKeys = observable.map<string, EvalKey[]>();

  constructor(private activityEditorStore: ActivityEditorStore) {
    makeAutoObservable(this);
    autorun(() => {
      const { savedActivity } = this.activityEditorStore;
      if (savedActivity instanceof Status) return;
      this.draftQuestionIdToEvalKeys.clear();
      for (const [questionId, evalKeys] of savedActivity.questionIdToEvalKey) {
        this.draftQuestionIdToEvalKeys.set(questionId, evalKeys);
      }
    });
  }
}
