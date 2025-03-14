import { autorun, makeAutoObservable, runInAction } from "mobx";
import { loading, notLoaded, Status } from "~/client/utils/status";
import { assertOne } from "~/common/assertions";
import { clone } from "~/common/cloneUtils";
import {
  createEmptyDescendents,
  createEmptyModifications,
  indexDescendents,
  rectifyModifications,
  upsertDescendents,
  type DescendentName,
  type DescendentRow,
  type DescendentRows,
  type Descendents,
  type DescendentTables,
  type Modifications,
} from "~/common/descendentUtils";
import { getDraftDate, getDraftId } from "~/common/draftData";
import { noop } from "~/common/fnUtils";
import { identity, objectEntries, objectValues } from "~/common/objectUtils";
import { type MessageDelta } from "~/server/db/pubsub/messageDeltaPubSub";
import { type FocusedActivityStore } from "./focusedActivityStore";
import { type HmrStore } from "./hmrStore";
import { type UserStore } from "./userStore";

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
  readDescendents: (params: {
    activityId: string;
    includeUserIds: string[];
  }) => Promise<Descendents>;
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

export class DescendentStore {
  public descendents = baseState().descendents;

  reset() {
    Object.assign(this, baseState());
  }

  constructor(
    private serverInterface: DescendentServerInterface,
    private focusedActivityStore: Pick<FocusedActivityStore, "activityId">,
    private userStore: Pick<UserStore, "user">,
    private hmrStore: Pick<HmrStore, "hmrCount">,
  ) {
    makeAutoObservable(this);

    this.autoRunLoadDescendents();
    this.autoRunSubscribeToDescendents();
    this.autoRunSubscribeToMessageDeltas();
  }

  private async loadDescendents(activityId: string, includeUserIds: string[]) {
    runInAction(() => {
      this.reset(); // funny that we have to wrap this -- I'd think this.reset would be an action??
    });
    runInAction(() => {
      this.descendents = loading;
    });
    const descendents = await this.serverInterface.readDescendents({
      activityId,
      includeUserIds,
    });
    runInAction(() => {
      this.descendents = indexDescendents(descendents);
    });
  }

  private autoRunLoadDescendents() {
    autorun(() => {
      const { activityId } = this.focusedActivityStore;
      if (!activityId) {
        return;
      }
      const { user } = this.userStore;
      const includeUserIds = user instanceof Status ? [] : [user.id];
      void this.loadDescendents(activityId, includeUserIds);
    });
  }

  private autoRunSubscribeToDescendents() {
    let unsub: () => void = noop;
    autorun(() => {
      const { activityId } = this.focusedActivityStore;
      if (!activityId) {
        return;
      }

      // run when hmrCount changes
      void this.hmrStore.hmrCount;

      // users are always streamed all activity descendent events
      // for which they have read permissions, so no need to pass in includeUserIds
      unsub();
      unsub = this.serverInterface.subscribeToNewDescendents(
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
      ).unsubscribe;
    });
  }

  private autoRunSubscribeToMessageDeltas() {
    let unsub: () => void = noop;
    autorun(() => {
      const { activityId } = this.focusedActivityStore;
      if (!activityId) {
        return;
      }

      // run when hmrCount changes
      void this.hmrStore.hmrCount;

      // users are always streamed all message delta events
      // for which they have read permissions, so no need to pass in includeUserIds
      unsub();
      unsub = this.serverInterface.subscribeToMessageDeltas(
        { activityId },
        (messageDelta: MessageDelta) => {
          const { descendents } = this;
          if (descendents instanceof Status) {
            return;
          }
          runInAction(() => {
            const descendent =
              descendents.messages[messageDelta.baseMessage.id];
            if (descendent !== undefined) {
              descendent.content += messageDelta.contentDelta;
            }
          });
        },
      ).unsubscribe;
    });
  }

  private incorporateModifications(modifications: Partial<Modifications>) {
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
  getManyByIds<T extends DescendentName>(descendentName: T, ids: string[]) {
    if (this.descendents instanceof Status) {
      return this.descendents;
    }
    return ids.map((id) => {
      if (this.descendents instanceof Status) {
        throw new Error("Descendents not loaded");
      }
      const descendent = this.descendents[descendentName][id];
      if (descendent === undefined) {
        throw new Error(`Descendent ${descendentName} with id ${id} not found`);
      }
      return descendent;
    });
  }

  async modify(
    modificationsPartial: Partial<Modifications>,
  ): Promise<Modifications> {
    if (
      !this.focusedActivityStore.activityId ||
      this.descendents instanceof Status
    ) {
      throw new Error("Cannot modify descendents while loading");
    }
    const ogToDelete =
      modificationsPartial.toDelete ?? createEmptyDescendents();
    const withCascadedDeletions = clone({
      ...createEmptyModifications(),
      ...modificationsPartial,
    });

    const deletionsById = new Map<
      string,
      {
        descendentName: DescendentName;
        descendent: DescendentRow;
      }
    >();
    objectEntries(ogToDelete).forEach(([descendentName, descendents]) =>
      descendents.forEach((descendent) => {
        deletionsById.set(descendent.id, { descendentName, descendent });
      }),
    );

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
                withCascadedDeletions.toDelete[descendentName].push(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  descendent as any,
                );
                deletionsById.set(id, { descendentName, descendent });
                newChildrenRecognized = true;
              }
            });
          });
        },
      );
    } while (newChildrenRecognized);

    const rectified = rectifyModifications(withCascadedDeletions);

    // optimistic update
    this.incorporateModifications(rectified);

    const result = await this.serverInterface.modifyDescendents({
      activityId: this.focusedActivityStore.activityId,
      modifications: rectified,
    });

    // We're relying on transactions on the BE to ensure that
    // this doesn't result in a race condition

    // might be some other updates in the modifications object
    // (e.g. correct createdAt fields)
    this.incorporateModifications(result);

    return result;
  }

  async create<T extends DescendentName>(
    descendentName: T,
    descendent: DescendentCreateParams<T>,
  ): Promise<DescendentRows[T]> {
    const newDescendent = {
      ...descendent,
      id: getDraftId(),
      activityId: this.focusedActivityStore.activityId,
      userId: getDraftId(),
      createdAt: getDraftDate(),
    };

    const modifications = await this.modify({
      toCreate: {
        ...createEmptyDescendents(),
        [descendentName]: [newDescendent],
      },
    });

    this.incorporateModifications(modifications);

    const allCreated = objectValues(modifications.toCreate[descendentName]);
    const created = assertOne(allCreated);
    return created as DescendentRows[T];
  }

  async update<T extends DescendentName>(
    descendentName: T,
    updatePartial: { id: string } & Partial<DescendentRows[T]>,
  ): Promise<DescendentRows[T]> {
    const descendent = this.getById(descendentName, updatePartial.id);
    if (descendent instanceof Status) {
      throw new Error("Descendent to update is not loaded");
    }

    const unverifiedUpdated = {
      ...descendent,
      ...updatePartial,
    };

    const modifications = await this.modify({
      toUpdate: {
        ...createEmptyDescendents(),
        [descendentName]: [unverifiedUpdated],
      },
    });

    const allUpdated = objectValues(modifications.toUpdate[descendentName]);
    const updated = assertOne(allUpdated);
    return updated as DescendentRows[T];
  }

  async delete(descendentName: DescendentName, id: string) {
    const descendent = this.getById(descendentName, id);
    if (descendent instanceof Status) {
      throw new Error("Descendent to delete is not loaded");
    }

    await this.modify({
      toDelete: {
        ...createEmptyDescendents(),
        [descendentName]: [descendent],
      },
    });
  }

  async deleteByIds(descendentName: DescendentName, ids: string[]) {
    const descendents = this.getManyByIds(descendentName, ids);
    if (descendents instanceof Status) {
      throw new Error("Descendents not loaded");
    }
    await this.modify({
      toDelete: {
        ...createEmptyDescendents(),
        [descendentName]: descendents,
      },
    });
  }
}
