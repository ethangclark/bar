import { makeAutoObservable } from "mobx";
import { identity } from "~/common/objectUtils";
import { loading, notLoaded, Status } from "~/common/status";
import { type ActivityDescendents } from "~/server/activityDescendents/types";
import { trpc } from "~/trpc/proxy";
import { selectDescendentsByIds } from "~/common/activityDescendentUtils";
import { type ActivityDescendentName } from "~/common/activityDescendentNames";

const baseState = () => ({
  tables: identity<ActivityDescendents | Status>(notLoaded),
  modifications: {
    createdIds: new Set<string>(),
    updatedIds: new Set<string>(),
    deletedIds: new Set<string>(),
  },
  saving: false,
  activityId: identity<string | undefined>(undefined),
});

export class ActivityEditorStore {
  private descendents = baseState().tables;
  private modifications = baseState().modifications;
  public saving = baseState().saving;
  private activityId = baseState().activityId;

  constructor() {
    makeAutoObservable(this);
  }

  async loadActivity(activityId: string) {
    this.descendents = loading;
    const activityDescendents = await trpc.activityDescendent.read.query({
      activityId,
    });
    this.descendents = activityDescendents;
  }

  reset() {
    Object.assign(this, baseState());
  }

  get canSave() {
    return !(this.descendents instanceof Status || this.saving);
  }

  async save() {
    if (!this.activityId || this.descendents instanceof Status) {
      throw new Error("Activity ID is required");
    }
    this.saving = true;
    try {
      const newDescendents = await trpc.activityDescendent.modify.mutate({
        activityId: this.activityId,
        activityDescendentModification: {
          toCreate: selectDescendentsByIds(
            this.descendents,
            this.modifications.createdIds,
          ),
          toUpdate: selectDescendentsByIds(
            this.descendents,
            this.modifications.updatedIds,
          ),
          toDelete: selectDescendentsByIds(
            this.descendents,
            this.modifications.deletedIds,
          ),
        },
      });
      this.descendents = newDescendents;
      this.modifications = baseState().modifications;
    } catch (e) {
      throw e;
    } finally {
      this.saving = false;
    }
  }

  createDraft<T extends ActivityDescendentName>(
    descendentName: T,
    descendent: Omit<ActivityDescendents[T][number], "id">,
  ) {
    const id = crypto.randomUUID();
    const newDescendent = {
      ...descendent,
      id,
    };
    this.descendents[descendentName][id] = newDescendent;
  }
}
