import { makeAutoObservable } from "mobx";

export class SessionBumpStore {
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
