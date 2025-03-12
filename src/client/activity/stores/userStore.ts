import { makeAutoObservable } from "mobx";
import { notLoaded, type NotLoaded } from "~/client/utils/status";

export class UserStore {
  // this is the "for realsies" userId
  private _userId: string | NotLoaded = notLoaded;

  private impersonatingUserId: string | null = null;

  public get userId() {
    if (this.impersonatingUserId !== null) {
      return this.impersonatingUserId;
    }
    return this._userId;
  }

  constructor() {
    makeAutoObservable(this);
  }

  setUserId(userId: string) {
    this._userId = userId;
  }

  impersonateUserId(userId: string) {
    this.impersonatingUserId = userId;
  }

  isImpersonating() {
    return this.impersonatingUserId !== null;
  }

  stopImpersonating() {
    this.impersonatingUserId = null;
  }
}
