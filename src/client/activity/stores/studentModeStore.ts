import { makeAutoObservable, reaction } from "mobx";
import { type ActivityStore } from "./activityStore";

export class StudentModeStore {
  public isStudentMode = false;

  constructor(activityStore: ActivityStore) {
    makeAutoObservable(this);
    reaction(
      () => activityStore.activityId,
      () => {
        this.isStudentMode = false;
      },
    );
  }

  setIsStudentMode(isStudentMode: boolean) {
    this.isStudentMode = isStudentMode;
  }
}
