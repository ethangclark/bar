import { makeAutoObservable, runInAction } from "mobx";
import { type RichActivity } from "~/common/schemas/richActivity";
import { Status, loading, neverLoaded } from "~/common/utils/status";
import { type ActivityItemWithChildren } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";
import { createDraftActivityItemWithChildren } from "./utils";
import { clone } from "~/common/utils/cloneUtils";
import {
  createModifiedIdTracker,
  getModificationOps,
} from "~/common/utils/activityUtils";

export class ActivityEditorStore {
  public savedActivity: RichActivity | Status = neverLoaded;
  public itemDrafts: ActivityItemWithChildren[] | Status = neverLoaded;

  // store info about the deltas we need to apply to the saved items
  private modifiedIdTracker = createModifiedIdTracker();

  constructor() {
    makeAutoObservable(this);
  }

  saving = false;

  get canSave() {
    return (
      !(this.savedActivity instanceof Status) &&
      !this.saving &&
      Object.values(this.modifiedIdTracker).some((set) => set.size > 0)
    );
  }

  async saveActivity() {
    if (
      !this.canSave ||
      this.savedActivity instanceof Status ||
      this.itemDrafts instanceof Status
    )
      return;
    this.saving = true;
    const modificationOps = getModificationOps(
      this.modifiedIdTracker,
      this.itemDrafts,
    );
    await trpc.activity.modifyActivity.mutate({
      activityId: this.savedActivity.id,
      modificationOps,
    });
    this.modifiedIdTracker = createModifiedIdTracker();
    this.saving = false;
    await this.loadActivity(this.savedActivity.id);
  }

  async loadActivity(activityId: string) {
    this.savedActivity = loading;
    this.itemDrafts = loading;
    const activity = await trpc.activity.details.query({ activityId });
    runInAction(() => {
      this.savedActivity = activity;
      this.itemDrafts = clone(activity.activityItems);
    });
  }
  clearActivity() {
    this.savedActivity = neverLoaded;
    this.itemDrafts = neverLoaded;
  }

  get sortedItemDrafts() {
    if (this.itemDrafts instanceof Status) {
      return [];
    }
    return this.itemDrafts
      .slice()
      .sort((a, b) => (a.orderFracIdx < b.orderFracIdx ? -1 : 1));
  }

  addDraftItem(itemType: "question" | "text" | "image") {
    if (
      this.savedActivity instanceof Status ||
      this.itemDrafts instanceof Status
    ) {
      return;
    }
    const afterOrderFracIdx =
      this.sortedItemDrafts.slice().pop()?.orderFracIdx ?? null;
    const draftItem = createDraftActivityItemWithChildren({
      activityId: this.savedActivity.id,
      afterOrderFracIdx,
      itemType,
    });
    this.modifiedIdTracker.newItemFakeIds.add(draftItem.id);
    this.itemDrafts.push(draftItem);
  }

  setItemQuestionDraftContent({
    itemId,
    content,
  }: {
    itemId: string;
    content: string;
  }) {
    if (this.itemDrafts instanceof Status) {
      return;
    }
    this.itemDrafts
      .filter((d) => d.id === itemId)
      .forEach((itemDraft) => {
        this.modifiedIdTracker.changedItemIds.add(itemId);
        itemDraft.questions.forEach((q) => {
          q.content = content;
        });
      });
  }
  setItemInfoTextDraftContent({
    itemId,
    content,
  }: {
    itemId: string;
    content: string;
  }) {
    if (this.itemDrafts instanceof Status) {
      return;
    }
    this.itemDrafts
      .filter((d) => d.id === itemId)
      .forEach((itemDraft) => {
        this.modifiedIdTracker.changedItemIds.add(itemId);
        itemDraft.infoTexts.forEach((q) => {
          q.content = content;
        });
      });
  }
  setItemInfoImageDraftUrl({ itemId, url }: { itemId: string; url: string }) {
    if (this.itemDrafts instanceof Status) {
      return;
    }
    this.itemDrafts
      .filter((d) => d.id === itemId)
      .forEach((itemDraft) => {
        this.modifiedIdTracker.changedItemIds.add(itemId);
        itemDraft.infoImages.forEach((q) => {
          q.url = url;
        });
      });
  }
  setItemInfoImageDraftTextAlternative({
    itemId,
    textAlternative,
  }: {
    itemId: string;
    textAlternative: string;
  }) {
    if (this.itemDrafts instanceof Status) {
      return;
    }
    this.itemDrafts
      .filter((d) => d.id === itemId)
      .forEach((itemDraft) => {
        this.modifiedIdTracker.changedItemIds.add(itemId);
        itemDraft.infoImages.forEach((q) => {
          q.textAlternative = textAlternative;
        });
      });
  }
  setItemDraftDeletion({
    itemId,
    deleted,
  }: {
    itemId: string;
    deleted: boolean;
  }) {
    if (this.itemDrafts instanceof Status) {
      return;
    }
    if (deleted) {
      this.modifiedIdTracker.deletedItemIds.add(itemId);
    } else {
      this.modifiedIdTracker.deletedItemIds.delete(itemId);
    }
  }
}
