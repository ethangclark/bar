import { makeAutoObservable } from "mobx";
import { notLoaded, type NotLoaded } from "~/client/utils/status";
import { type UserBasic } from "~/common/types";

export class UserStore {
  // this is the "for realsies" userId
  private _user: UserBasic | NotLoaded = notLoaded;

  public impersonating: UserBasic | null = null;

  public get user() {
    if (this.impersonating !== null) {
      return this.impersonating;
    }
    return this._user;
  }

  constructor() {
    makeAutoObservable(this);
  }

  setUser(user: UserBasic) {
    this._user = user;
  }

  impersonateUser(user: UserBasic) {
    this.impersonating = user;
  }

  stopImpersonating() {
    this.impersonating = null;
  }
}
