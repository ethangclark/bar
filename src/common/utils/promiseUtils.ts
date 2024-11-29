import { ShouldNeverHappen } from "./errorUtils";

export function splitPromise<T>() {
  let resolve: ((value: T) => void) | undefined;
  let reject: ((error: unknown) => void) | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  if (!resolve || !reject) throw new ShouldNeverHappen();
  return { resolve, reject, promise };
}
