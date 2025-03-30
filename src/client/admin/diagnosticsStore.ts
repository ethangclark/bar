import { makeAutoObservable } from "mobx";
import { type LocationStore } from "../activity/stores/locationStore";

export class DiagnosticsStore {
  constructor(private locationStore: LocationStore) {
    makeAutoObservable(this);
  }

  get diagnosticsEnabled() {
    return this.locationStore.searchParam("diagnostics") === "enabled";
  }

  toggleDiagnostics() {
    this.locationStore.setSearchParam(
      "diagnostics",
      this.diagnosticsEnabled ? undefined : "enabled",
    );
  }
}
