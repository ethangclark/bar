import { autorun, makeAutoObservable, reaction, runInAction } from "mobx";
import { loading, notLoaded, Status } from "~/client/utils/status";
import { clone } from "~/common/cloneUtils";
import {
  descendentNames,
  rectifyModifications,
  selectDescendents,
  upsertDescendents,
  type DescendentName,
  type DescendentRows,
  type DescendentTables,
} from "~/common/descendentUtils";
import { getDraftDate, getDraftId } from "~/common/draftData";
import { identity, objectValues } from "~/common/objectUtils";
import { trpc } from "~/trpc/proxy";
import {
  type DescendentCreateParams,
  type DescendentStore,
} from "./descendentStore";
import { type FocusedActivityStore } from "./focusedActivityStore";
const baseState = () => ({
  drafts: identity<DescendentTables | Status>(notLoaded),
  changes: {
    createdIds: new Set<string>(),
    updatedIds: new Set<string>(),
    deletedIds: new Set<string>(),
  },
});

export class DescendentDraftStore {
  private drafts = baseState().drafts;
  private changes = baseState().changes;

  constructor(
    private focusedActivityStore: FocusedActivityStore,
    private descendentStore: DescendentStore,
  ) {
    makeAutoObservable(this);

    // when the activity ID changes,
    // create drafts based on the new descendents
    // (once they load)
    reaction(
      () => this.focusedActivityStore.activityId,
      () => {
        runInAction(() => {
          this.reset();
          this.drafts = loading;
        });
        const stop = autorun(() => {
          const { descendents } = this.descendentStore;
          if (descendents instanceof Status) {
            return;
          }
          runInAction(() => {
            this.drafts = clone(descendents);
            stop();
          });
        });
      },
    );
  }

  reset() {
    Object.assign(this, baseState());
  }

  get hasChanges() {
    if (this.drafts instanceof Status) {
      return false;
    }
    const totalChanges = objectValues(this.changes)
      .map((s) => s.size)
      .reduce((a, b) => a + b, 0);
    return totalChanges > 0;
  }

  async saveChanges() {
    if (
      !this.focusedActivityStore.activityId ||
      this.drafts instanceof Status
    ) {
      throw new Error("Descendents are not loaded");
    }
    const { drafts } = this;
    this.drafts = loading;
    try {
      const modifications = await trpc.descendent.modify.mutate({
        activityId: this.focusedActivityStore.activityId,
        modifications: rectifyModifications({
          toCreate: selectDescendents(drafts, this.changes.createdIds),
          toUpdate: selectDescendents(drafts, this.changes.updatedIds),
          toDelete: selectDescendents(drafts, this.changes.deletedIds),
        }),
      });
      this.descendentStore.handleModifications(modifications);
      runInAction(() => {
        upsertDescendents(drafts, modifications.toCreate);
        upsertDescendents(drafts, modifications.toUpdate);
        this.changes.deletedIds.forEach((id) => {
          descendentNames.forEach((name) => {
            delete drafts[name][id];
          });
        });
        this.drafts = drafts;
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
    descendent: DescendentCreateParams<T>,
  ) {
    if (!this.focusedActivityStore.activityId) {
      throw new Error("Activity ID is not set");
    }
    if (this.drafts instanceof Status) {
      throw new Error("Descendents are not loaded");
    }
    const id = getDraftId();
    const newDescendent = {
      ...descendent,
      id,
      activityId: this.focusedActivityStore.activityId,
      userId: getDraftId(),
      createdAt: getDraftDate(),
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
  toggleDeletion(id: string) {
    if (this.drafts instanceof Status) {
      return;
    }
    if (this.changes.deletedIds.has(id)) {
      this.changes.deletedIds.delete(id);
    } else {
      this.changes.deletedIds.add(id);
    }
  }

  isDeletedDraft(id: string) {
    // TODO: handle cascading deletes based off of foreign keys :/
    return this.changes.deletedIds.has(id);
  }
}
