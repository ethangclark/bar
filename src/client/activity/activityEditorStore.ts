import { makeAutoObservable } from "mobx";
import { QueryStore } from "~/common/utils/queryStore";
import { trpc } from "~/trpc/proxy";

export class ActivityEditorStore {
  private query = new QueryStore(trpc.activity.details.query);

  constructor() {
    makeAutoObservable(this);
  }

  get activity() {
    return this.query.data;
  }

  clearActivity() {
    this.query.reset();
  }

  loadActivity(activityId: string) {
    void this.query.fetch({ activityId }).then((activity) => {
      console.log({ activity });
    });
  }
}
