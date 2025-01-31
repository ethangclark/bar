import { ShouldNeverHappenError } from "./errorUtils";

export function splitPromise<T>() {
  let resolve: ((value: T) => void) | undefined;
  let reject: ((error: unknown) => void) | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  if (!resolve || !reject) throw new ShouldNeverHappenError();
  return { resolve, reject, promise };
}

export function splitResults<T>(results: Array<PromiseSettledResult<T>>): {
  errors: Error[];
  values: T[];
} {
  const errors = results
    .filter((r) => r.status === "rejected")
    .map((r) =>
      "reason" in r && r.reason instanceof Error
        ? r.reason
        : new Error("Unknown error"),
    );
  const values = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as { value: T }).value);
  return { errors, values };
}

export function valuesElseThrow<T>(
  results: Array<PromiseSettledResult<T>>,
): T[] {
  const { errors, values } = splitResults(results);

  if (errors.length > 0) {
    throw new AggregateError(errors, "Some operations failed");
  }

  return values;
}

export function throwIfFailures<T>(results: Array<PromiseSettledResult<T>>) {
  valuesElseThrow(results);
}
