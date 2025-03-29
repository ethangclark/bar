import { makeAutoObservable } from "mobx";

export class DiagnosticsStore {
  diagnosticsEnabled = false;

  constructor() {
    makeAutoObservable(this);
  }

  toggleDiagnostics() {
    this.diagnosticsEnabled = !this.diagnosticsEnabled;
  }
}
