import { makeAutoObservable, runInAction } from "mobx";
import { identity } from "~/common/objectUtils";
import { notLoaded, type Status } from "~/common/status";
import { type RichActivity } from "~/common/types";
import { trpc } from "~/trpc/proxy";

const baseState = () => ({
  activityId: identity<string | undefined>(undefined),
  activity: identity<RichActivity | Status>(notLoaded),
});

export class ActivityStore {
  public activityId = baseState().activityId;
  public activity = baseState().activity;

  constructor() {
    makeAutoObservable(this);
  }

  async loadActivity(activityId: string) {
    this.activityId = activityId;
    const activity = await trpc.activity.get.query({ activityId });
    runInAction(() => {
      this.activity = activity;
    });
  }

  reset() {
    Object.assign(this, baseState());
  }
}
