import superjson from "superjson";
import { type SuperJsonObject } from "~/common/types";
import { trpc } from "~/trpc/proxy";

export class ReportableError extends Error {
  name = "ReportableError";
  constructor(
    message: string,
    public details: SuperJsonObject,
  ) {
    super(message);
  }
}

export function reportClientError(
  error: ReportableError | Error,
  additionalDetails: SuperJsonObject = {},
) {
  if (error instanceof ReportableError) {
    void trpc.error.recordError.mutate({
      message: error.message,
      detailsSuperJsonString: superjson.stringify({
        ...additionalDetails,
        ...error.details,
      }),
    });
  }
  void trpc.error.recordError.mutate({
    message: error.message,
    detailsSuperJsonString: superjson.stringify({
      ...additionalDetails,
      stack: error.stack,
    }),
  });
}

if (typeof window !== "undefined") {
  window.onerror = (message, source, lineno, colno, error) => {
    reportClientError(
      error ?? new Error(message instanceof Event ? "Unknown Error" : message),
      {
        message: message instanceof Event ? undefined : message,
        source,
        lineno,
        colno,
      },
    );
    // return false; // Prevents default browser error handling
  };

  // // not using this because adblockers can trigger it
  // window.addEventListener('error', (event) => {
  //   console.error('Resource Loading Error:', event);
  //   // Handle resource loading failures
  // }, true); // Use capture phase to catch resource errors

  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(event.reason);
  });
}
