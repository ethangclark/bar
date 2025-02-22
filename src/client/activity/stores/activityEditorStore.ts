import { makeAutoObservable } from "mobx";
import { Status } from "~/client/utils/status";
import { type DescendentDraftStore } from "./descendentDraftStore";
import { type DescendentStore } from "./descendentStore";

export class ActivityEditorStore {
  constructor(
    private descendentStore: DescendentStore,
    private descendentDraftStore: DescendentDraftStore,
  ) {
    makeAutoObservable(this);
  }

  get canSave() {
    if (!this.descendentDraftStore.hasChanges) {
      return false;
    }
    return true;
  }

  get canDemo() {
    if (this.canSave) {
      return false;
    }
    const items = this.descendentStore.get("items");
    if (items instanceof Status) {
      return false;
    }
    return items.length > 0;
  }

  async save() {
    await this.descendentDraftStore.saveChanges();
  }
}
