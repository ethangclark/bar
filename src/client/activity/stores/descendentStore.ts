import { autorun, makeAutoObservable, reaction, runInAction } from "mobx";
import { loading, notLoaded, Status } from "~/client/utils/status";
import { assertOne } from "~/common/assertions";
import {
  createEmptyDescendents,
  indexDescendents,
  upsertDescendents,
  type DescendentName,
  type DescendentRow,
  type DescendentRows,
  type Descendents,
  type DescendentTables,
  type Modifications,
} from "~/common/descendentUtils";
import { getDraftDate, getDraftId } from "~/common/draftData";
import { identity, objectEntries, objectValues } from "~/common/objectUtils";
import { type MessageDelta } from "~/common/types";
import { type FocusedActivityStore } from "./focusedActivityStore";

const baseState = () => ({
  descendents: identity<DescendentTables | Status>(notLoaded),
});

// omitted params are supplied on the back-end --
// values provided by the rows are / should be ignored
export type DescendentCreateParams<T extends DescendentName> = Omit<
  DescendentRows[T],
  "id" | "activityId" | "userId" | "createdAt"
>;

export type DescendentServerInterface = {
  readDescendents: (params: { activityId: string }) => Promise<Descendents>;
  subscribeToNewDescendents: (
    params: { activityId: string },
    onDescendents: (descendents: Descendents) => void,
  ) => { unsubscribe: () => void };
  subscribeToMessageDeltas: (
    params: { activityId: string },
    onMessageDelta: (messageDelta: MessageDelta) => void,
  ) => { unsubscribe: () => void };
  modifyDescendents: (params: {
    activityId: string;
    modifications: Modifications;
  }) => Promise<Modifications>;
};

// could add optimistic updates here
export class DescendentStore {
  public descendents = baseState().descendents;

  constructor(
    private serverInterface: DescendentServerInterface,
    private focusedActivityStore: FocusedActivityStore,
  ) {
    makeAutoObservable(this);
    autorun(() => {
      const { activityId } = this.focusedActivityStore;
      if (!activityId) {
        return;
      }
      void this.loadDescendents(activityId);
      this.subscribeToDescendents(activityId);
      this.subscribeToMessageDeltas(activityId);
    });
  }

  private async loadDescendents(activityId: string) {
    this.reset();
    this.descendents = loading;
    const descendents = await this.serverInterface.readDescendents({
      activityId,
    });
    runInAction(() => {
      this.descendents = indexDescendents(descendents);
    });
  }
  private subscribeToDescendents(activityId: string) {
    const subscription = this.serverInterface.subscribeToNewDescendents(
      { activityId },
      (descendents: Descendents) => {
        const existing = this.descendents;
        if (existing instanceof Status) {
          return;
        }
        runInAction(() => {
          upsertDescendents(existing, descendents);
        });
      },
    );
    reaction(
      () => this.focusedActivityStore.activityId,
      () => {
        subscription.unsubscribe();
      },
      {
        fireImmediately: false,
      },
    );
  }
  private subscribeToMessageDeltas(activityId: string) {
    const subscription = this.serverInterface.subscribeToMessageDeltas(
      { activityId },
      (messageDelta: MessageDelta) => {
        const { descendents } = this;
        if (descendents instanceof Status) {
          return;
        }
        runInAction(() => {
          const descendent = descendents.messages[messageDelta.messageId];
          if (descendent !== undefined) {
            descendent.content += messageDelta.contentDelta;
          }
        });
      },
    );
    reaction(
      () => this.focusedActivityStore.activityId,
      () => {
        subscription.unsubscribe();
      },
    );
  }

  reset() {
    Object.assign(this, baseState());
  }

  handleModifications(modifications: Partial<Modifications>) {
    const { descendents } = this;
    if (descendents instanceof Status) {
      return;
    }
    if (modifications.toCreate) {
      upsertDescendents(descendents, modifications.toCreate);
    }
    if (modifications.toUpdate) {
      upsertDescendents(descendents, modifications.toUpdate);
    }
    if (modifications.toDelete) {
      objectEntries(modifications.toDelete).forEach(
        ([descendentName, toDelete]) => {
          toDelete.forEach((descendent) => {
            delete descendents[descendentName][descendent.id];
          });
        },
      );
    }
  }

  getById<T extends DescendentName>(descendentName: T, id: string) {
    if (this.descendents instanceof Status) {
      return this.descendents;
    }
    return this.descendents[descendentName][id] ?? notLoaded;
  }
  get<T extends DescendentName>(descendentName: T) {
    if (this.descendents instanceof Status) {
      return this.descendents;
    }
    return Object.values(this.descendents[descendentName]);
  }

  async create<T extends DescendentName>(
    descendentName: T,
    descendent: DescendentCreateParams<T>,
  ): Promise<DescendentRows[T]> {
    if (!this.focusedActivityStore.activityId) {
      throw new Error("Activity ID is not set");
    }
    const newDescendent = {
      ...descendent,
      id: getDraftId(),
      activityId: this.focusedActivityStore.activityId,
      userId: getDraftId(),
      createdAt: getDraftDate(),
    };
    const toCreate = createEmptyDescendents();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toCreate[descendentName].push(newDescendent as any);

    // optimistic update
    this.handleModifications({ toCreate });

    const modifications = await this.serverInterface.modifyDescendents({
      activityId: this.focusedActivityStore.activityId,
      modifications: {
        toCreate,
        toUpdate: createEmptyDescendents(),
        toDelete: createEmptyDescendents(),
      },
    });

    // We're relying on transactions on the BE to ensure that
    // this doesn't result in a race condition

    // might be some other updates in the modifications object
    // (e.g. correct createdAt fields)
    this.handleModifications(modifications);

    const allCreated = objectValues(modifications.toCreate[descendentName]);
    const created = assertOne(allCreated);
    return created as DescendentRows[T];
  }
  async update<T extends DescendentName>(
    descendentName: T,
    updatePartial: { id: string } & Partial<DescendentRows[T]>,
  ): Promise<DescendentRows[T]> {
    if (!this.focusedActivityStore.activityId) {
      throw new Error("Activity ID is not set");
    }
    const descendent = this.getById(descendentName, updatePartial.id);
    if (descendent instanceof Status) {
      throw new Error("Descendent to update is not loaded");
    }

    const update = {
      ...descendent,
      ...updatePartial,
    };
    const toUpdate = createEmptyDescendents();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toUpdate[descendentName].push(update as any);

    // optimistic update
    this.handleModifications({ toUpdate });

    const modifications = await this.serverInterface.modifyDescendents({
      activityId: this.focusedActivityStore.activityId,
      modifications: {
        toCreate: createEmptyDescendents(),
        toUpdate,
        toDelete: createEmptyDescendents(),
      },
    });

    // We're relying on transactions on the BE to ensure that
    // this doesn't result in a race condition

    // might be some other updates in the modifications object
    // (e.g. correct updatedAt fields)
    this.handleModifications(modifications);

    const allUpdated = objectValues(modifications.toUpdate[descendentName]);
    const updated = assertOne(allUpdated);
    return updated as DescendentRows[T];
  }

  // recursively finds all descendents that need to be deleted
  // as a result of wanting to delete the given descendent
  private getAllDescendentsToDelete(rootDeletion: {
    descendentName: DescendentName;
    descendent: DescendentRow;
  }): Descendents | Status {
    if (this.descendents instanceof Status) {
      return this.descendents;
    }
    const deletionsById = new Map<
      string,
      {
        descendentName: DescendentName;
        descendent: DescendentRow;
      }
    >([[rootDeletion.descendent.id, rootDeletion]]);

    let newChildrenRecognized = false;
    do {
      newChildrenRecognized = false;
      objectEntries(this.descendents).forEach(
        ([descendentName, idToDescendent]) => {
          objectEntries(idToDescendent).forEach(([id, descendent]) => {
            if (deletionsById.has(id)) {
              return;
            }
            objectValues(descendent).forEach((fieldValue) => {
              // if some descendent we hadn't planned on deleting references a descendent we are deleting,
              // delete it as well (because descendents all have onUpdate: 'cascade' behavior)
              if (deletionsById.has(fieldValue)) {
                deletionsById.set(id, { descendentName, descendent });
                newChildrenRecognized = true;
              }
            });
          });
        },
      );
    } while (newChildrenRecognized);

    const descendents = createEmptyDescendents();
    for (const deletion of deletionsById.values()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      descendents[deletion.descendentName].push(deletion.descendent as any);
    }
    return descendents;
  }
  async delete(descendentName: DescendentName, id: string) {
    if (!this.focusedActivityStore.activityId) {
      throw new Error("Activity ID is not set");
    }
    const descendent = this.getById(descendentName, id);
    if (descendent instanceof Status) {
      return;
    }

    const toDelete = this.getAllDescendentsToDelete({
      descendentName,
      descendent,
    });
    if (toDelete instanceof Status) {
      return;
    }

    // optimistic update
    this.handleModifications({ toDelete });

    await this.serverInterface.modifyDescendents({
      activityId: this.focusedActivityStore.activityId,
      modifications: {
        toCreate: createEmptyDescendents(),
        toUpdate: createEmptyDescendents(),
        toDelete,
      },
    });

    // deletes already handled; we're done
  }
}
