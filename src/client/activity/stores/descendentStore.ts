import { autorun, makeAutoObservable, reaction, runInAction } from "mobx";
import { loading, notLoaded, Status } from "~/client/utils/status";
import { assertOne } from "~/common/arrayUtils";
import { type DescendentName } from "~/common/descendentNames";
import {
  createEmptyDescendents,
  indexDescendents,
  upsertDescendents,
} from "~/common/descendentUtils";
import { getDraftDate, getDraftId } from "~/common/draftData";
import { identity, objectValues } from "~/common/objectUtils";
import { type MessageDeltaSchema } from "~/common/types";
import {
  type DescendentRows,
  type Descendents,
  type DescendentTables,
} from "~/server/descendents/descendentTypes";
import { trpc } from "~/trpc/proxy";
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

// could add optimistic updates here
export class DescendentStore {
  public descendents = baseState().descendents;

  constructor(private focusedActivityStore: FocusedActivityStore) {
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
    const descendents = await trpc.descendent.read.query({
      activityId,
    });
    runInAction(() => {
      this.descendents = indexDescendents(descendents);
    });
  }
  private subscribeToDescendents(activityId: string) {
    const subscription = trpc.descendent.newDescendents.subscribe(
      { activityId },
      {
        onData: (descendents: Descendents) => {
          const existing = this.descendents;
          if (existing instanceof Status) {
            return;
          }
          runInAction(() => {
            upsertDescendents(existing, descendents);
          });
        },
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
    const subscription = trpc.message.messageDeltas.subscribe(
      { activityId },
      {
        onData: (messageDelta: MessageDeltaSchema) => {
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
    runInAction(() => {
      if (this.descendents instanceof Status) {
        // another activity is loading
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (this.descendents[descendentName] as any)[newDescendent.id] =
        newDescendent;
    });

    const result = await trpc.descendent.modify.mutate({
      activityId: this.focusedActivityStore.activityId,
      modifications: {
        toCreate,
        toUpdate: createEmptyDescendents(),
        toDelete: createEmptyDescendents(),
      },
    });
    runInAction(() => {
      if (this.descendents instanceof Status) {
        // another activity is loading
        return;
      }
      upsertDescendents(this.descendents, result);
    });
    const allCreated = objectValues(result[descendentName]);
    const created = assertOne(allCreated);
    return created as DescendentRows[T];
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
    runInAction(() => {
      if (this.descendents instanceof Status) {
        // another activity is loading
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (this.descendents[descendentName] as any)[update.id] = update;
    });

    const result = await trpc.descendent.modify.mutate({
      activityId: this.focusedActivityStore.activityId,
      modifications: {
        toCreate: createEmptyDescendents(),
        toUpdate,
        toDelete: createEmptyDescendents(),
      },
    });
    runInAction(() => {
      if (this.descendents instanceof Status) {
        // another activity is loading
        return;
      }
      upsertDescendents(this.descendents, result);
    });
    const allUpdated = objectValues(result[descendentName]);
    const updated = assertOne(allUpdated);
    return updated as DescendentRows[T];
  }
  async delete(descendentName: DescendentName, id: string) {
    if (!this.focusedActivityStore.activityId) {
      throw new Error("Activity ID is not set");
    }
    const descendent = this.getById(descendentName, id);
    if (descendent instanceof Status) {
      return;
    }

    // optimistic update
    runInAction(() => {
      if (this.descendents instanceof Status) {
        throw new Error(
          "Descendents are not loaded; cannot integrate result of descendent deletion",
        );
      }
      delete this.descendents[descendentName][id];
    });

    const toDelete = createEmptyDescendents();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toDelete[descendentName].push(descendent as any);
    await trpc.descendent.modify.mutate({
      activityId: this.focusedActivityStore.activityId,
      modifications: {
        toCreate: createEmptyDescendents(),
        toUpdate: createEmptyDescendents(),
        toDelete,
      },
    });
  }
}
