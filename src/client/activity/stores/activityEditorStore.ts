import { makeAutoObservable } from "mobx";
import { Status } from "~/client/utils/status";
import { type ActivityDraftStore } from "./activityDraftStore";
import { type DescendentStore } from "./descendentStore";

export class ActivityEditorStore {
  constructor(
    private descendentStore: DescendentStore,
    private activityDraftStore: ActivityDraftStore,
  ) {
    makeAutoObservable(this);
  }

  get canSave() {
    if (!this.activityDraftStore.hasChanges) {
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
    await this.activityDraftStore.saveChanges();
  }
}
