import { autorun, makeAutoObservable, runInAction } from "mobx";
import { type DescendentName } from "~/common/descendentNames";
import {
  createEmptyDescendents,
  deindexDescendents,
  indexDescendents,
  mergeDescendents,
} from "~/common/descendentUtils";
import { draftDate, getDraftId } from "~/common/draftData";
import { identity, objectValues } from "~/common/objectUtils";
import { loading, notLoaded, Status } from "~/common/status";
import {
  type DescendentRows,
  type DescendentTables,
} from "~/server/descendents/types";
import { trpc } from "~/trpc/proxy";
import { type ActivityStore } from "./activityStore";

const baseState = () => ({
  descendents: identity<DescendentTables | Status>(notLoaded),
});

export type DescendentCreateParams<T extends DescendentName> = Omit<
  DescendentRows[T],
  "id" | "activityId" | "userId" | "createdAt"
>;

export class DescendentStore {
  public descendents = baseState().descendents;

  constructor(private activityStore: ActivityStore) {
    makeAutoObservable(this);
    autorun(() => {
      const activityId = this.activityStore.activityId;
      if (!activityId) {
        return;
      }
      void this.loadDescendents(activityId);
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
      createdAt: draftDate,
    };
    const toCreate = createEmptyDescendents();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toCreate[descendentName].push(newDescendent as any);
    const result = await trpc.descendent.create.mutate({
      activityId: this.activityStore.activityId,
      descendents: toCreate,
    });
    runInAction(() => {
      if (this.descendents instanceof Status) {
        throw new Error(
          "Descendents are not loaded; cannot integrate result of descendent creation",
        );
      }
      this.descendents = indexDescendents(
        mergeDescendents(deindexDescendents(this.descendents), result),
      );
    });
    const [created, ...excess] = objectValues(result[descendentName]);
    if (created === undefined) {
      throw new Error(
        `Created 0 descendents; expected 1; result: ${JSON.stringify(result)}`,
      );
    }
    if (excess.length > 0) {
      throw new Error(
        `Created ${excess.length} descendents; expected 1; result: ${JSON.stringify(
          result,
        )}`,
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
    updates: { id: string } & Partial<DescendentRows[T]>,
  ): Promise<DescendentRows[T]> {
    if (!this.activityStore.activityId) {
      throw new Error("Activity ID is not set");
    }
    const descendent = this.getById(descendentName, updates.id);
    if (descendent instanceof Status) {
      throw new Error("Descendent to update is not loaded");
    }
    const toUpdate = createEmptyDescendents();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toUpdate[descendentName].push(updates as any);
    const result = await trpc.descendent.update.mutate({
      activityId: this.activityStore.activityId,
      descendents: toUpdate,
    });
    runInAction(() => {
      if (this.descendents instanceof Status) {
        throw new Error(
          "Descendents are not loaded; cannot integrate result of descendent update",
        );
      }
      this.descendents = indexDescendents(
        mergeDescendents(deindexDescendents(this.descendents), result),
      );
    });
    const [updated, ...excess] = objectValues(result[descendentName]);
    if (updated === undefined) {
      throw new Error(
        `Updated 0 descendents; expected 1; result: ${JSON.stringify(result)}`,
      );
    }
    if (excess.length > 0) {
      throw new Error(
        `Updated ${excess.length} descendents; expected 1; result: ${JSON.stringify(
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
    const toDelete = createEmptyDescendents();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toDelete[descendentName].push(descendent as any);
    await trpc.descendent.delete.mutate({
      activityId: this.activityStore.activityId,
      descendents: toDelete,
    });
    runInAction(() => {
      if (this.descendents instanceof Status) {
        throw new Error(
          "Descendents are not loaded; cannot integrate result of descendent deletion",
        );
      }
      delete this.descendents[descendentName][id];
    });
  }
}
