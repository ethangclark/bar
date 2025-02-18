import { makeAutoObservable, reaction } from "mobx";
import { type FocusedActivityStore } from "./focusedActivityStore";

export class StudentModeStore {
  public isStudentMode = false;

  constructor(focusedActivityStore: FocusedActivityStore) {
    makeAutoObservable(this);
    reaction(
      () => focusedActivityStore.activityId,
      () => {
        this.isStudentMode = false;
      },
    );
  }

  setIsStudentMode(isStudentMode: boolean) {
    this.isStudentMode = isStudentMode;
  }
}
