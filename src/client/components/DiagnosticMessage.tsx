import { storeObserver } from "../utils/storeObserver";

export const DiagnosticMessage = storeObserver<{
  diagnosticMessage: string;
}>(function DiagnosticMessage({ diagnosticMessage, diagnosticsStore }) {
  const { diagnosticsEnabled } = diagnosticsStore;
  return diagnosticsEnabled ? <span># {diagnosticMessage}</span> : null;
});
