import { makeAutoObservable } from "mobx";
import { notLoaded, type NotLoaded } from "~/client/utils/status";

export class UserStore {
  public userId: string | NotLoaded = notLoaded;

  constructor() {
    makeAutoObservable(this);
  }

  setUserId(userId: string) {
    this.userId = userId;
  }
}
