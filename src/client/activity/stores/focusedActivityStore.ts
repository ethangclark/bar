import { makeAutoObservable, runInAction } from "mobx";
import { notLoaded, Status } from "~/client/utils/status";
import { assertTypesExhausted } from "~/common/assertions";
import { getEnrolledAs } from "~/common/enrollmentTypeUtils";
import { noop } from "~/common/fnUtils";
import { identity } from "~/common/objectUtils";
import { type RichActivity } from "~/common/types";

const baseState = () => ({
  activityId: identity<string | undefined>(undefined),
  activity: identity<RichActivity | Status>(notLoaded),
});

export type ActivityServerInterface = {
  getActivity: (params: { activityId: string }) => Promise<RichActivity>;
  updateActivityTitle: (params: {
    activityId: string;
    title: string;
  }) => Promise<void>;
};

export class FocusedActivityStore {
  public activityId = baseState().activityId;
  public activity = baseState().activity;

  constructor(private serverInterface: ActivityServerInterface) {
    makeAutoObservable(this);
  }

  async loadActivity(activityId: string) {
    this.activityId = activityId;
    const activity = await this.serverInterface.getActivity({ activityId });
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

  get isTitleEditable() {
    if (this.activity instanceof Status) {
      return this.activity;
    }
    return this.activity.type === "adHoc";
  }
  titleSaving = false;
  titleSavedTimeout = setTimeout(noop);
  async updateTitle(title: string) {
    if (this.activity instanceof Status) {
      return;
    }
    switch (this.activity.type) {
      case "adHoc":
        this.titleSaving = true;
        const oldTitle = this.activity.adHocActivity.title;
        this.activity.adHocActivity.title = title;
        try {
          await this.serverInterface.updateActivityTitle({
            activityId: this.activity.id,
            title,
          });
        } catch (e) {
          this.activity.adHocActivity.title = oldTitle;
          throw e;
        } finally {
          this.titleSaving = false;
        }
        break;
      case "integration":
        break;
      default:
        assertTypesExhausted(this.activity);
    }
  }

  get data() {
    const { activity, enrolledAs, title, isTitleEditable } = this;
    if (activity instanceof Status) return activity;
    if (enrolledAs instanceof Status) return enrolledAs;
    if (title instanceof Status) return title;
    if (isTitleEditable instanceof Status) return isTitleEditable;

    return {
      activity,
      enrolledAs,
      title,
      isTitleEditable,
    };
  }
}
