import { makeAutoObservable, reaction } from "mobx";
import { z } from "zod";
import { notLoaded, Status } from "~/client/utils/status";
import {
  type EnrollmentType,
  isGraderOrDeveloper,
} from "~/common/enrollmentTypeUtils";
import { searchParamsX } from "~/common/searchParams";
import { type FocusedActivityStore } from "./focusedActivityStore";

const viewModes = ["editor", "doer", "submissions"] as const;
const viewModeSchema = z.enum(viewModes);
export type ViewMode = z.infer<typeof viewModeSchema>;

function getDefaultMode(enrolledAs: EnrollmentType[]) {
  if (isGraderOrDeveloper(enrolledAs)) {
    return "editor";
  }
  return "doer";
}

export class ViewModeStore {
  public viewMode: ViewMode | Status = notLoaded;
  private lastOverride: ViewMode | null = null;

  constructor(private focusedActivityStore: FocusedActivityStore) {
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
          this.viewMode = getDefaultMode(data.activity.enrolledAs);
        }
      },
    );
  }

  private setViewModeState(mode: ViewMode | null) {
    this.lastOverride = mode;
    if (mode && !(this.viewMode instanceof Status)) {
      this.viewMode = mode;
    }
  }

  private get defaultMode() {
    if (this.focusedActivityStore.activity instanceof Status) {
      return this.focusedActivityStore.activity;
    }
    return getDefaultMode(this.focusedActivityStore.activity.enrolledAs);
  }

  private updateViewModeFromURL() {
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get(searchParamsX.view.key);
    if (!viewParam && !(this.defaultMode instanceof Status)) {
      this.setViewModeState(this.defaultMode);
    }
    const result = viewModeSchema.safeParse(viewParam);
    this.setViewModeState(result.success ? result.data : null);
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    this.lastOverride = mode;

    // Update URL search params when viewMode changes
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);

      if (mode === this.defaultMode) {
        // Clear the view query param when setting to default mode
        url.searchParams.delete(searchParamsX.view.key);
      } else {
        // Set the query param for non-default modes
        url.searchParams.set(searchParamsX.view.key, mode);
      }

      window.history.pushState({}, "", url.toString());
    }
  }
}
