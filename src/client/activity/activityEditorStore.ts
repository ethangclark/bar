import { makeAutoObservable } from "mobx";
import { QueryStore } from "~/common/utils/queryStore";
import { Status } from "~/common/utils/status";
import { type ActivityItemWithChildren } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";
import { createDraftActivityItemWithChildren } from "./utils";

export class ActivityEditorStore {
  private query = new QueryStore(trpc.activity.details.query);

  constructor() {
    makeAutoObservable(this);
  }

  get activity() {
    return this.query.data;
  }

  private overrideDraftsById = new Map<string, ActivityItemWithChildren>();
  private newDraftsByDraftId = new Map<string, ActivityItemWithChildren>();
  clearActivity() {
    this.query.reset();
    this.overrideDraftsById.clear();
    this.newDraftsByDraftId.clear();
  }

  loadActivity(activityId: string) {
    void this.query.fetch({ activityId }).then((activity) => {
      console.log({ activity });
    });
  }

  get activityItemDrafts() {
    if (this.query.data instanceof Status) {
      return [];
    }
    const withDraftOverrides = this.query.data.activityItems.map((item) => {
      return this.overrideDraftsById.get(item.id) ?? item;
    });
    return [...withDraftOverrides, ...this.newDraftsByDraftId.values()];
  }
  get sortedActivityItemDrafts() {
    return this.activityItemDrafts.sort((a, b) =>
      a.orderFracIdx < b.orderFracIdx ? -1 : 1,
    );
  }

  addDraftItem(itemType: "question" | "text" | "image") {
    if (this.activity instanceof Status) {
      return;
    }
    const afterOrderFracIdx =
      this.activityItemDrafts.slice().pop()?.orderFracIdx ?? null;
    const draft = createDraftActivityItemWithChildren({
      activityId: this.activity.id,
      afterOrderFracIdx,
      itemType,
    });
    this.newDraftsByDraftId.set(draft.id, draft);
  }
}
