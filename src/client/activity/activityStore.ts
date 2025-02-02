import { makeAutoObservable, runInAction } from "mobx";
import { descendentNames, type DescendentName } from "~/common/descendentNames";
import { identity } from "~/common/objectUtils";
import { loading, notLoaded, Status } from "~/common/status";
import {
  type DescendentRows,
  type DescendentTables,
} from "~/server/descendents/types";
import { trpc } from "~/trpc/proxy";
import {
  deindexDescendents,
  indexDescendents,
  mergeDescendents,
  selectDescendents,
} from "~/common/descendentUtils";
import { type RichActivity } from "~/common/types";

const baseState = () => ({
  drafts: identity<DescendentTables | Status>(notLoaded),
  changes: {
    createdIds: new Set<string>(),
    updatedIds: new Set<string>(),
    deletedIds: new Set<string>(),
  },
  activityId: identity<string | undefined>(undefined),
  activity: identity<RichActivity | Status>(notLoaded),
});

export class ActivityStore {
  private drafts = baseState().drafts;
  private changes = baseState().changes;
  public activityId = baseState().activityId;
  public activity = baseState().activity;

  constructor() {
    makeAutoObservable(this);
  }

  async loadActivity(activityId: string) {
    this.activityId = activityId;
    this.drafts = loading;
    const [descendents, activity] = await Promise.all([
      trpc.descendent.read.query({
        activityId,
      }),
      trpc.activity.get.query({ activityId }),
    ]);
    runInAction(() => {
      this.drafts = indexDescendents(descendents);
      this.activity = activity;
    });
  }

  reset() {
    Object.assign(this, baseState());
  }

  get canSave() {
    return !(this.drafts instanceof Status);
  }

  async save() {
    if (!this.activityId || this.drafts instanceof Status) {
      throw new Error("Descendents are not loaded");
    }
    const { drafts } = this;
    this.drafts = loading;
    try {
      const descendents = await trpc.descendent.modify.mutate({
        activityId: this.activityId,
        modifications: {
          toCreate: selectDescendents(drafts, this.changes.createdIds),
          toUpdate: selectDescendents(drafts, this.changes.updatedIds),
          toDelete: selectDescendents(drafts, this.changes.deletedIds),
        },
      });
      runInAction(() => {
        const withUpdates = mergeDescendents(
          deindexDescendents(drafts),
          descendents,
        );
        const newDrafts = indexDescendents(withUpdates);
        this.changes.deletedIds.forEach((id) => {
          descendentNames.forEach((name) => {
            delete newDrafts[name][id];
          });
        });
        this.drafts = newDrafts;
        this.changes = baseState().changes;
      });
    } catch (e) {
      runInAction(() => {
        this.drafts = drafts;
      });
      throw e;
    }
  }

  createDraft<T extends DescendentName>(
    descendentName: T,
    descendent: Omit<DescendentRows[T], "id" | "activityId">,
  ) {
    if (!this.activityId) {
      throw new Error("Activity ID is not set");
    }
    if (this.drafts instanceof Status) {
      throw new Error("Descendents are not loaded");
    }
    const id = crypto.randomUUID();
    const newDescendent = {
      ...descendent,
      id,
      activityId: this.activityId,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (this.drafts[descendentName] as any)[id] = newDescendent;
    this.changes.createdIds.add(id);
    return newDescendent;
  }
  getDraft<T extends DescendentName>(descendentName: T, id: string) {
    if (this.drafts instanceof Status) {
      return this.drafts;
    }
    return this.drafts[descendentName][id] ?? notLoaded;
  }
  getDrafts<T extends DescendentName>(descendentName: T) {
    if (this.drafts instanceof Status) {
      return this.drafts;
    }
    return Object.values(this.drafts[descendentName]);
  }
  updateDraft<T extends DescendentName>(
    descendentName: T,
    updates: { id: string } & Partial<DescendentRows[T]>,
  ) {
    const descendent = this.getDraft(descendentName, updates.id);
    if (descendent instanceof Status || this.drafts instanceof Status) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (this.drafts[descendentName] as any)[updates.id] = {
      ...descendent,
      ...updates,
    };
    this.changes.updatedIds.add(updates.id);
  }
  deleteDraft(id: string) {
    if (this.drafts instanceof Status) {
      return;
    }
    this.changes.deletedIds.add(id);
  }

  isDeleted(id: string) {
    return this.changes.deletedIds.has(id);
  }
}
