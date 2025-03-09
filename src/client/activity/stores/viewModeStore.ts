import { makeAutoObservable, reaction } from "mobx";
import { z } from "zod";
import { notLoaded, Status } from "~/client/utils/status";
import { viewModeQueryParam } from "~/common/constants";
import { type FocusedActivityStore } from "./focusedActivityStore";

const viewModes = ["editor", "doer", "submissions"] as const;
const viewModeSchema = z.enum(viewModes);
type ViewMode = z.infer<typeof viewModeSchema>;

export class ViewModeStore {
  public viewMode: ViewMode | Status = notLoaded;
  private lastOverride: ViewMode | null = null;

  constructor(focusedActivityStore: FocusedActivityStore) {
    makeAutoObservable(this);

    // Initialize lastOverride from URL search params if available
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get(viewModeQueryParam);
      const result = viewModeSchema.safeParse(viewParam);
      if (result.success) {
        this.lastOverride = result.data;
      }
    }

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

    // Update URL search params when viewMode changes
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set(viewModeQueryParam, viewMode);
      window.history.replaceState({}, "", url.toString());
    }
  }
}
