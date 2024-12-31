import { makeAutoObservable, runInAction } from "mobx";
import { identity } from "~/common/utils/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class QueryStore<T extends (...args: any[]) => Promise<any>> {
  private lastArgs: Parameters<T> | null = null;
  private lastLoader: Promise<unknown> = Promise.resolve();
  private fn: T;
  constructor(fn: T) {
    this.fn = fn;
    makeAutoObservable(this);
  }
  data = identity<null | Awaited<ReturnType<T>>>(null);
  isLoading = false;
  hasLoadedOnce = false;
  async fetch(...args: Parameters<T>): Promise<ReturnType<T>> {
    this.lastArgs = args;
    runInAction(() => {
      this.data = null;
      this.isLoading = true;
    });
    const loader = this.fn(...args);
    this.lastLoader = loader;
    const data = await loader;
    if (this.lastLoader !== loader) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data;
    }
    runInAction(() => {
      this.data = data;
      this.isLoading = false;
      this.hasLoadedOnce = true;
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }
  async refetch() {
    if (!this.lastArgs) return;
    return this.fetch(...this.lastArgs);
  }
}
