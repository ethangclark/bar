import { makeAutoObservable, runInAction } from "mobx";
import { loading, type Status, notLoaded, NotLoaded } from "./status";
import { identity } from "../../common/objectUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class QueryStore<T extends (...args: any[]) => Promise<any>> {
  private readonly initialState = {
    data: identity<Status | Awaited<ReturnType<T>>>(notLoaded),
    swr: identity<Status | Awaited<ReturnType<T>>>(notLoaded),
    lastArgs: undefined as Parameters<T> | undefined,
    lastLoadIdInitiated: -Infinity,
    nextLoadId: 1,
    lastLoadIdCompleted: -Infinity,
  };

  data = this.initialState.data;
  swr = this.initialState.swr;
  private lastArgs = this.initialState.lastArgs;
  private lastLoadIdInitiated = this.initialState.lastLoadIdInitiated;
  private nextLoadId = this.initialState.nextLoadId;
  private lastLoadIdCompleted = this.initialState.lastLoadIdCompleted;

  constructor(private fn: T) {
    makeAutoObservable(this);
  }

  reset() {
    Object.assign(this, this.initialState);
  }

  async fetch(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    this.lastArgs = args;
    const loadId = this.nextLoadId;
    runInAction(() => {
      this.data = loading;
      if (this.swr instanceof NotLoaded) {
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
