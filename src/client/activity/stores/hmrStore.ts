import { makeAutoObservable } from "mobx";

export class HmrStore {
  public hmrCount = 0;

  constructor() {
    makeAutoObservable(this);
  }

  public incrementHmrCount() {
    this.hmrCount++;
  }
}
