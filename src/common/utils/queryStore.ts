import { makeAutoObservable, runInAction } from "mobx";
import { identity } from "~/common/utils/types";
import { loading, type Status, neverLoaded, NeverLoaded } from "./status";

// could add a `swr` (stale-while-revalidate) field,
// perhaps leveraging a ReloadingStatus class (see status.ts)
// (would require tracking request dispatch order so if they return out of order
// we never override later-sent with earlier-sent)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class QueryStore<T extends (...args: any[]) => Promise<any>> {
  constructor(private fn: T) {
    makeAutoObservable(this);
  }

  data = identity<Status | Awaited<ReturnType<T>>>(neverLoaded);

  // stale-white-revalidate; will return the most recent data, even while reloading is occurring
  swr = identity<Status | Awaited<ReturnType<T>>>(neverLoaded);

  private lastArgs: Parameters<T> | undefined = undefined;
  private lastLoadIdInitiated = -Infinity;
  private nextLoadId = 1;
  private lastLoadIdCompleted = -Infinity;

  reset() {
    this.data = neverLoaded;
    this.swr = neverLoaded;
    this.lastArgs = undefined;
    this.lastLoadIdInitiated = -Infinity;
    this.nextLoadId = 1;
    this.lastLoadIdCompleted = -Infinity;
  }

  async fetch(...args: Parameters<T>): Promise<ReturnType<T>> {
    this.lastArgs = args;
    const loadId = this.nextLoadId;
    runInAction(() => {
      this.data = loading;
      if (this.swr instanceof NeverLoaded) {
        this.swr = loading;
      }
      this.nextLoadId++;
    });

    this.lastLoadIdInitiated = loadId;

    const data = await this.fn(...args);

    const isMoreRecentThanLastCompleted = loadId > this.lastLoadIdCompleted;
    this.lastLoadIdCompleted = loadId;

    runInAction(() => {
      if (isMoreRecentThanLastCompleted) {
        this.swr = data;
      }
      if (this.lastLoadIdInitiated === loadId) {
        this.data = data;
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }
  async refetch() {
    if (!this.lastArgs) return;
    return this.fetch(...this.lastArgs);
  }
}
