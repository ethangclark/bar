import { makeAutoObservable } from "mobx";
import { Status } from "~/client/utils/status";
import { type VideoUploadStore } from "../Item/videoUploadStore";
import { type DescendentDraftStore } from "./descendentDraftStore";
import { type DescendentStore } from "./descendentStore";

export class ActivityEditorStore {
  private savingChanges = false;

  constructor(
    private descendentStore: DescendentStore,
    private descendentDraftStore: DescendentDraftStore,
    private videoUploadStore: VideoUploadStore,
  ) {
    makeAutoObservable(this);
  }

  get canSave() {
    if (this.videoUploadStore.teedForAJuicySave) {
      // we assume descendentDraftStore is in a valid state; it doesn't have an "invalid state" concept at present
      // (TODO: add one)
      return true;
    }
    if (!this.videoUploadStore.isEverythingPersisted) {
      return false;
    }
    return this.descendentDraftStore.hasChanges;
  }

  get canDemo() {
    if (this.canSave) {
      return false;
    }
    if (!this.videoUploadStore.isEverythingPersisted) {
      return false;
    }
    const items = this.descendentStore.get("items");
    if (items instanceof Status) {
      return false;
    }
    return items.length > 0;
  }

  async save() {
    this.savingChanges = true;
    await Promise.all([
      this.descendentDraftStore.saveChanges(),
      this.videoUploadStore.saveVideos(),
    ]);
    this.savingChanges = false;
  }

  get isSaving() {
    return this.savingChanges;
  }
}
