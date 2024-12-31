import { makeAutoObservable, runInAction } from "mobx";
import { identity } from "~/common/utils/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createQueryStore = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
) => {
  let lastLoader: Promise<unknown> = Promise.resolve();
  let lastArgs: Parameters<T> | null = null;
  type Result = Awaited<ReturnType<T>>;
  return makeAutoObservable({
    data: identity<null | Result>(null),
    isLoading: false,
    hasLoadedOnce: false,
    async fetch(...args: Parameters<T>): Promise<Result> {
      lastArgs = args;
      runInAction(() => {
        this.data = null;
        this.isLoading = true;
      });
      const loader = fn(...args);
      lastLoader = loader;
      const data = await loader;
      if (lastLoader !== loader) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return data; // currently not updating staleWhileRevalidate in this case, as it would require us to track order of requests
      }
      runInAction(() => {
        this.data = data;
        this.isLoading = false;
        this.hasLoadedOnce = true;
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data;
    },
    async refetch() {
      if (!lastArgs) return;
      return this.fetch(...lastArgs);
    },
  });
};
