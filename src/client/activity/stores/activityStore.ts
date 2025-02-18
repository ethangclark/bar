import { makeAutoObservable, runInAction } from "mobx";
import { notLoaded, Status } from "~/client/utils/status";
import { getEnrolledAs } from "~/common/enrollmentTypeUtils";
import { identity } from "~/common/objectUtils";
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

  get enrolledAs() {
    if (this.activity instanceof Status) {
      return this.activity;
    }
    return getEnrolledAs(this.activity);
  }

  get title(): string | Status {
    if (this.activity instanceof Status) {
      return this.activity;
    }
    switch (this.activity.type) {
      case "integration":
        return this.activity.assignment.title;
      case "adHoc":
        return this.activity.adHocActivity.title;
    }
  }

  get juicyDeets() {
    const { activity, enrolledAs, title } = this;
    if (activity instanceof Status) return activity;
    if (enrolledAs instanceof Status) return enrolledAs;
    if (title instanceof Status) return title;
    return {
      activity,
      enrolledAs,
      title,
    };
  }
}
