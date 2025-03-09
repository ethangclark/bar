import { makeAutoObservable, reaction } from "mobx";
import { z } from "zod";
import { notLoaded, Status } from "~/client/utils/status";
import { viewModeQueryParam } from "~/common/constants";
import { type FocusedActivityStore } from "./focusedActivityStore";

const viewModes = ["editor", "doer", "submissions"] as const;
const viewModeSchema = z.enum(viewModes);
type ViewMode = z.infer<typeof viewModeSchema>;

const defaultMode: ViewMode = "doer";

export class ViewModeStore {
  public viewMode: ViewMode | Status = notLoaded;
  private lastOverride: ViewMode | null = null;

  constructor(focusedActivityStore: FocusedActivityStore) {
    makeAutoObservable(this);

    // Initialize lastOverride from URL search params if available
    if (typeof window !== "undefined") {
      this.updateViewModeFromURL();

      // Listen for popstate events (browser back/forward navigation)
      window.addEventListener("popstate", () => {
        this.updateViewModeFromURL();
      });
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
          this.viewMode = defaultMode;
        }
      },
    );
  }

  private updateViewModeFromURL() {
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get(viewModeQueryParam);
    const result = viewModeSchema.safeParse(viewParam);
    const mode = result.success ? result.data : defaultMode;
    this.lastOverride = mode;
    if (!(this.viewMode instanceof Status)) {
      this.viewMode = mode;
    }
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    this.lastOverride = mode;

    // Update URL search params when viewMode changes
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);

      if (mode === defaultMode) {
        // Clear the view query param when setting to default mode
        url.searchParams.delete(viewModeQueryParam);
      } else {
        // Set the query param for non-default modes
        url.searchParams.set(viewModeQueryParam, mode);
      }

      window.history.pushState({}, "", url.toString());
    }
  }
}
