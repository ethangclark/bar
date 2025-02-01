import { makeAutoObservable, runInAction } from "mobx";
import { type DescendentName } from "~/common/descendentNames";
import { identity } from "~/common/objectUtils";
import { loading, notLoaded, Status } from "~/common/status";
import {
  type DescendentRows,
  type DescendentTables,
} from "~/server/descendents/types";
import { trpc } from "~/trpc/proxy";
import {
  createEmptyDescendents,
  indexDescendents,
  mergeDescendents,
  selectDescendents,
} from "~/common/descendentUtils";
import { type RichActivity } from "~/common/types";

const baseState = () => ({
  saved: () => createEmptyDescendents(),
  tables: identity<DescendentTables | Status>(notLoaded),
  changes: {
    createdIds: new Set<string>(),
    updatedIds: new Set<string>(),
    deletedIds: new Set<string>(),
  },
  saving: false,
  activityId: identity<string | undefined>(undefined),
  activity: identity<RichActivity | Status>(notLoaded),
});

export class ActivityEditorStore {
  private saved = baseState().saved;
  private tables = baseState().tables;
  public changes = baseState().changes;
  public saving = baseState().saving;
  public activityId = baseState().activityId;
  public activity = baseState().activity;

  constructor() {
    makeAutoObservable(this);
  }

  async loadActivity(activityId: string) {
    this.activityId = activityId;
    this.tables = loading;
    const [descendents, activity] = await Promise.all([
      trpc.descendent.read.query({
        activityId,
      }),
      trpc.activity.get.query({ activityId }),
    ]);
    runInAction(() => {
      this.saved = () => descendents;
      this.tables = indexDescendents(descendents);
      this.activity = activity;
    });
  }

  reset() {
    Object.assign(this, baseState());
  }

  get canSave() {
    return !(this.tables instanceof Status || this.saving);
  }

  async save() {
    if (!this.activityId || this.tables instanceof Status) {
      throw new Error("Activity ID is required");
    }
    this.saving = true;
    try {
      const newDescendents = await trpc.descendent.modify.mutate({
        activityId: this.activityId,
        descendentModification: {
          toCreate: selectDescendents(this.tables, this.changes.createdIds),
          toUpdate: selectDescendents(this.tables, this.changes.updatedIds),
          toDelete: selectDescendents(this.tables, this.changes.deletedIds),
        },
      });
      runInAction(() => {
        const saved = mergeDescendents(this.saved(), newDescendents);
        this.saved = () => saved;
        this.tables = indexDescendents(saved);
        this.changes = baseState().changes;
      });
    } catch (e) {
      throw e;
    } finally {
      this.saving = false;
    }
  }

  createDraft<T extends DescendentName>(
    descendentName: T,
    descendent: Omit<DescendentRows[T], "id" | "activityId">,
  ) {
    if (!this.activityId) {
      throw new Error("Activity ID is not set");
    }
    if (this.tables instanceof Status) {
      throw new Error("Descendents are not loaded");
    }
    const id = crypto.randomUUID();
    const newDescendent = {
      ...descendent,
      id,
      activityId: this.activityId,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (this.tables[descendentName] as any)[id] = newDescendent;
    this.changes.createdIds.add(id);
    return newDescendent;
  }
  getDraft<T extends DescendentName>(descendentName: T, id: string) {
    if (this.tables instanceof Status) {
      return this.tables;
    }
    return this.tables[descendentName][id] ?? notLoaded;
  }
  getDrafts<T extends DescendentName>(descendentName: T) {
    if (this.tables instanceof Status) {
      return this.tables;
    }
    return Object.values(this.tables[descendentName]);
  }
  getDraftsSorted<T extends DescendentName>(
    descendentName: T,
    sortFn: (a: DescendentRows[T], b: DescendentRows[T]) => number,
  ) {
    const drafts = this.getDrafts(descendentName);
    if (drafts instanceof Status) {
      return drafts;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return drafts.slice().sort(sortFn as any);
  }
  updateDraft<T extends DescendentName>(
    descendentName: T,
    updates: { id: string } & Partial<DescendentRows[T]>,
  ) {
    const descendent = this.getDraft(descendentName, updates.id);
    if (descendent instanceof Status || this.tables instanceof Status) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (this.tables[descendentName] as any)[updates.id] = {
      ...descendent,
      ...updates,
    };
    this.changes.updatedIds.add(updates.id);
  }
  deleteDraft(id: string) {
    if (this.tables instanceof Status) {
      return;
    }
    this.changes.deletedIds.add(id);
  }

  get sortedItems() {
    const items = this.getDraftsSorted("activityItems", (a, b) =>
      a.orderFracIdx < b.orderFracIdx ? -1 : 1,
    );
    if (items instanceof Status) {
      throw new Error("Items are not loaded");
    }
    return items;
  }
}
