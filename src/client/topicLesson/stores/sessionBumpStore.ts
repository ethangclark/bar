import { makeAutoObservable } from "mobx";

class SessionBumpStore {
  constructor() {
    makeAutoObservable(this);
  }
  bumpingNotificationModalOpen = false;
  openModal() {
    this.bumpingNotificationModalOpen = true;
  }
  closeModal() {
    this.bumpingNotificationModalOpen = false;
  }
}

export const sessionBumpStore = new SessionBumpStore();
