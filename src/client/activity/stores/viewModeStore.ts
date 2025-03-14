import { makeAutoObservable } from "mobx";
import { z } from "zod";
import { Status } from "~/client/utils/status";
import {
  type EnrollmentType,
  isGraderOrDeveloper,
} from "~/common/enrollmentTypeUtils";
import { type FocusedActivityStore } from "./focusedActivityStore";
import { type LocationStore } from "./locationStore";

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
  get viewMode() {
    const { data } = this.focusedActivityStore;
    if (data instanceof Status) {
      return data;
    }
    const { igod, activity } = data;
    if (igod && this.locationStore.searchParams.activityViewMode) {
      return this.locationStore.searchParams.activityViewMode;
    }
    return getDefaultMode(activity.enrolledAs);
  }

  constructor(
    private focusedActivityStore: FocusedActivityStore,
    private locationStore: LocationStore,
  ) {
    makeAutoObservable(this);
  }

  public setViewMode(mode: ViewMode | null) {
    if (mode === null) {
      this.locationStore.deleteSearchParam("activityViewMode");
      return;
    }
    const { activity } = this.focusedActivityStore;
    if (activity instanceof Status) {
      throw new Error("Activity is not loaded");
    }
    const defaultMode = getDefaultMode(activity.enrolledAs);
    if (mode === defaultMode) {
      this.locationStore.deleteSearchParam("activityViewMode");
    } else {
      this.locationStore.setSearchParam("activityViewMode", mode);
    }
  }
}
