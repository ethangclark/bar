import { makeAutoObservable, runInAction } from "mobx";
import { notLoaded, Status } from "~/client/utils/status";
import { assertTypesExhausted } from "~/common/assertions";
import { isGraderOrDeveloper } from "~/common/enrollmentTypeUtils";
import { noop } from "~/common/fnUtils";
import { identity } from "~/common/objectUtils";
import { type RichActivity } from "~/common/types";
import { trpc } from "~/trpc/proxy";

const baseState = () => ({
  activityId: identity<string | undefined>(undefined),
  activity: identity<RichActivity | Status>(notLoaded),
});

export class FocusedActivityStore {
  public activityId = baseState().activityId;
  public activity = baseState().activity;

  constructor() {
    makeAutoObservable(this);
  }

  async loadActivity(activityId: string) {
    runInAction(() => {
      this.activityId = activityId;
    });
    const activity = await trpc.activity.get.query({ activityId });
    runInAction(() => {
      this.activity = activity;
    });
  }

  reset() {
    Object.assign(this, baseState());
  }

  get igod() {
    if (this.activity instanceof Status) {
      return this.activity;
    }
    return isGraderOrDeveloper(this.activity.enrolledAs);
  }

  get title(): string | Status {
    if (this.activity instanceof Status) {
      return this.activity;
    }
    switch (this.activity.type) {
      case "integration":
        return this.activity.assignment.title;
      case "standalone":
        return this.activity.standaloneActivity.title;
    }
  }

  get isTitleEditable() {
    if (this.activity instanceof Status) {
      return this.activity;
    }
    return this.activity.type === "standalone";
  }
  titleSaving = false;
  titleSavedTimeout = setTimeout(noop);
  async updateTitle(title: string) {
    if (this.activity instanceof Status) {
      return;
    }
    switch (this.activity.type) {
      case "standalone":
        this.titleSaving = true;
        const oldTitle = this.activity.standaloneActivity.title;
        this.activity.standaloneActivity.title = title;
        try {
          await trpc.activity.updateStandaloneActivity.mutate({
            activityId: this.activity.id,
            title,
          });
        } catch (e) {
          this.activity.standaloneActivity.title = oldTitle;
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

  async publish() {
    if (this.activity instanceof Status) {
      throw new Error("Can't publish -- activity not loaded");
    }
    const oldStatus = this.activity.status;
    this.activity.status = "published";
    try {
      await trpc.activity.updateStatus.mutate({
        activityId: this.activity.id,
        status: "published",
      });
    } catch (e) {
      this.activity.status = oldStatus;
      throw e;
    }
  }
  async unpublish() {
    if (this.activity instanceof Status) {
      throw new Error("Can't unpublish -- activity not loaded");
    }
    const oldStatus = this.activity.status;
    this.activity.status = "draft";
    try {
      await trpc.activity.updateStatus.mutate({
        activityId: this.activity.id,
        status: "draft",
      });
    } catch (e) {
      this.activity.status = oldStatus;
      throw e;
    }
  }

  get data() {
    const { activity, igod, title, isTitleEditable } = this;
    if (activity instanceof Status) return activity;
    if (igod instanceof Status) return igod;
    if (title instanceof Status) return title;
    if (isTitleEditable instanceof Status) return isTitleEditable;

    return {
      activity,
      igod,
      title,
      isTitleEditable,
    };
  }
}
