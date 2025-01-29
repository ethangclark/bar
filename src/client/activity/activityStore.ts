import { makeAutoObservable } from "mobx";
import { type RichActivity } from "~/common/schemas/richActivity";
import {
  createModifiedIdTracker,
  getModificationOps,
} from "~/common/utils/activityUtils";
import { clone } from "~/common/utils/cloneUtils";
import { Status, neverLoaded } from "~/common/utils/status";
import { type ActivityItemWithChildren } from "~/server/db/schema";
import { trpc } from "~/trpc/proxy";
import { createDraftActivityItemWithChildren } from "./utils";

export class ActivityStore {
  public savedActivity: RichActivity | Status = neverLoaded;

  // not sorted
  private allItemDrafts: ActivityItemWithChildren[] | Status = neverLoaded;

  // store info about the deltas we need to apply to the saved items
  private modifiedIdTracker = createModifiedIdTracker();

  constructor() {
    makeAutoObservable(this);
  }

  saving = false;

  reset() {
    this.savedActivity = neverLoaded;
    this.allItemDrafts = neverLoaded;
    this.modifiedIdTracker = createModifiedIdTracker();
  }

  get canSave() {
    return (
      !(this.savedActivity instanceof Status) &&
      !this.saving &&
      Object.values(this.modifiedIdTracker).some((set) => set.size > 0)
    );
  }

  async save() {
    if (
      !this.canSave ||
      this.savedActivity instanceof Status ||
      this.allItemDrafts instanceof Status
    )
      return;
    this.saving = true;
    const modificationOps = getModificationOps(
      this.modifiedIdTracker,
      this.allItemDrafts,
    );
    await trpc.activity.modifyActivity.mutate({
      activityId: this.savedActivity.id,
      modificationOps,
    });
    this.modifiedIdTracker = createModifiedIdTracker();
    this.saving = false;
  }

  loadActivity(activity: RichActivity) {
    this.savedActivity = activity;
    this.allItemDrafts = clone(activity.activityItems);
  }

  get itemDrafts() {
    if (this.allItemDrafts instanceof Status) {
      return this.allItemDrafts;
    }
    return this.allItemDrafts
      .slice()
      .sort((a, b) => (a.orderFracIdx < b.orderFracIdx ? -1 : 1))
      .map((item) => {
        return {
          ...item,
          deleted: this.modifiedIdTracker.deletedItemIds.has(item.id),
        };
      });
  }

  addDraftItem(itemType: "question" | "text" | "image") {
    if (
      this.savedActivity instanceof Status ||
      this.allItemDrafts instanceof Status ||
      this.itemDrafts instanceof Status
    ) {
      return;
    }
    const afterOrderFracIdx =
      this.itemDrafts.slice().pop()?.orderFracIdx ?? null;
    const draftItem = createDraftActivityItemWithChildren({
      activityId: this.savedActivity.id,
      afterOrderFracIdx,
      itemType,
    });
    this.modifiedIdTracker.newItemFakeIds.add(draftItem.id);
    this.allItemDrafts.push(draftItem);
  }

  setItemQuestionDraftContent({
    itemId,
    content,
  }: {
    itemId: string;
    content: string;
  }) {
    if (this.allItemDrafts instanceof Status) {
      return;
    }
    this.allItemDrafts
      .filter((d) => d.id === itemId)
      .forEach((itemDraft) => {
        this.modifiedIdTracker.changedItemIds.add(itemId);
        if (itemDraft.question) {
          itemDraft.question.content = content;
        }
      });
  }
  setItemInfoTextDraftContent({
    itemId,
    content,
  }: {
    itemId: string;
    content: string;
  }) {
    if (this.allItemDrafts instanceof Status) {
      return;
    }
    this.allItemDrafts
      .filter((d) => d.id === itemId)
      .forEach((itemDraft) => {
        this.modifiedIdTracker.changedItemIds.add(itemId);
        if (itemDraft.infoText) {
          itemDraft.infoText.content = content;
        }
      });
  }
  setItemInfoImageDraftUrl({ itemId, url }: { itemId: string; url: string }) {
    if (this.allItemDrafts instanceof Status) {
      return;
    }
    this.allItemDrafts
      .filter((d) => d.id === itemId)
      .forEach((itemDraft) => {
        this.modifiedIdTracker.changedItemIds.add(itemId);
        if (itemDraft.infoImage) {
          itemDraft.infoImage.url = url;
        }
      });
  }
  setItemInfoImageDraftTextAlternative({
    itemId,
    textAlternative,
  }: {
    itemId: string;
    textAlternative: string;
  }) {
    if (this.allItemDrafts instanceof Status) {
      return;
    }
    this.allItemDrafts
      .filter((d) => d.id === itemId)
      .forEach((itemDraft) => {
        this.modifiedIdTracker.changedItemIds.add(itemId);
        if (itemDraft.infoImage) {
          itemDraft.infoImage.textAlternative = textAlternative;
        }
      });
  }
  setItemDraftDeletion({
    itemId,
    deleted,
  }: {
    itemId: string;
    deleted: boolean;
  }) {
    if (this.allItemDrafts instanceof Status) {
      return;
    }
    if (deleted) {
      this.modifiedIdTracker.deletedItemIds.add(itemId);
    } else {
      this.modifiedIdTracker.deletedItemIds.delete(itemId);
    }
  }
}
