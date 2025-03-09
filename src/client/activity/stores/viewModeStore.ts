import { makeAutoObservable, reaction } from "mobx";
import { notLoaded, Status } from "~/client/utils/status";
import { type FocusedActivityStore } from "./focusedActivityStore";

type ViewMode = "editor" | "doer" | "submissions";

export class ViewModeStore {
  public viewMode: ViewMode | Status = notLoaded;
  private lastOverride: ViewMode | null = null;

  constructor(focusedActivityStore: FocusedActivityStore) {
    makeAutoObservable(this);
    reaction(
      () => focusedActivityStore.data,
      (data) => {
        if (data instanceof Status) {
          this.viewMode = data;
          return;
        }
        if (data.igod && this.lastOverride) {
          this.viewMode = this.lastOverride;
        } else {
          this.viewMode = "doer";
        }
      },
    );
  }

  setViewMode(viewMode: ViewMode) {
    this.viewMode = viewMode;
    this.lastOverride = viewMode;
  }
}
