import { autorun, makeAutoObservable, reaction, runInAction } from "mobx";
import { type DescendentName } from "~/common/descendentNames";
import {
  createEmptyDescendents,
  deindexDescendents,
  indexDescendents,
  mergeDescendents,
} from "~/common/descendentUtils";
import { getDraftDate, getDraftId } from "~/common/draftData";
import { identity, objectValues } from "~/common/objectUtils";
import { loading, notLoaded, Status } from "~/client/utils/status";
import {
  type DescendentRows,
  type DescendentTables,
} from "~/server/descendents/types";
import { trpc } from "~/trpc/proxy";
import { type ActivityStore } from "./activityStore";
import { type Message } from "~/server/db/schema";
import { type MessageDeltaSchema } from "~/common/types";

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

  constructor(private activityStore: ActivityStore) {
    makeAutoObservable(this);
    autorun(() => {
      const { activityId } = this.activityStore;
      if (!activityId) {
        return;
      }
      void this.loadDescendents(activityId);
      this.subscribeToActivityMessages(activityId);
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
  private subscribeToActivityMessages(activityId: string) {
    const subscription = trpc.message.newMessages.subscribe(
      { activityId },
      {
        onData: (messages: Message[]) => {
          const { descendents } = this;
          if (descendents instanceof Status) {
            return;
          }
          runInAction(() => {
            messages.forEach((message) => {
              descendents.messages[message.id] = message;
            });
          });
        },
      },
    );
    reaction(
      () => this.activityStore.activityId,
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
      () => this.activityStore.activityId,
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
    if (!this.activityStore.activityId) {
      throw new Error("Activity ID is not set");
    }
    const newDescendent = {
      ...descendent,
      id: getDraftId(),
      activityId: this.activityStore.activityId,
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
      activityId: this.activityStore.activityId,
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
      this.descendents = indexDescendents(
        mergeDescendents(deindexDescendents(this.descendents), result),
      );
    });
    const allCreated = objectValues(result[descendentName]);
    const [created, ...excess] = allCreated;
    if (created === undefined || excess.length > 0) {
      throw new Error(
        `Created ${allCreated.length} descendents; expected 1; result: ${JSON.stringify(result)}`,
      );
    }
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
    if (!this.activityStore.activityId) {
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
      activityId: this.activityStore.activityId,
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
      this.descendents = indexDescendents(
        mergeDescendents(deindexDescendents(this.descendents), result),
      );
    });
    const allUpdated = objectValues(result[descendentName]);
    const [updated, ...excess] = allUpdated;
    if (updated === undefined || excess.length > 0) {
      throw new Error(
        `Updated ${allUpdated.length} descendents; expected 1; result: ${JSON.stringify(
          result,
        )}`,
      );
    }
    return updated as DescendentRows[T];
  }
  async delete(descendentName: DescendentName, id: string) {
    if (!this.activityStore.activityId) {
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
      activityId: this.activityStore.activityId,
      modifications: {
        toCreate: createEmptyDescendents(),
        toUpdate: createEmptyDescendents(),
        toDelete,
      },
    });
  }
}
