import { makeAutoObservable, runInAction } from "mobx";
import { identity } from "~/common/utils/types";
import { loading, type Status, neverLoaded, NeverLoaded } from "./status";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class QueryStore<T extends (...args: any[]) => Promise<any>> {
  private readonly initialState = {
    data: identity<Status | Awaited<ReturnType<T>>>(neverLoaded),
    swr: identity<Status | Awaited<ReturnType<T>>>(neverLoaded),
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
