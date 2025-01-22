import { observable } from "mobx";
import { type ActivityItemWithChildren } from "~/server/db/schema";

export const createModifiedIdTracker = () => ({
  newItemFakeIds: observable.set<string>(),
  changedItemIds: observable.set<string>(),
  deletedItemIds: observable.set<string>(),
});

export function getModificationOps(
  {
    newItemFakeIds,
    changedItemIds,
    deletedItemIds,
  }: ReturnType<typeof createModifiedIdTracker>,
  itemDrafts: ActivityItemWithChildren[],
): {
  toCreate: ActivityItemWithChildren[];
  toUpdate: ActivityItemWithChildren[];
  toDelete: string[];
} {
  const toCreate = itemDrafts
    .filter((d) => newItemFakeIds.has(d.id))
    .filter((d) => !deletedItemIds.has(d.id));
  const toUpdate = itemDrafts
    .filter((d) => changedItemIds.has(d.id))
    .filter((d) => !deletedItemIds.has(d.id))
    .filter((d) => !newItemFakeIds.has(d.id));
  const toDelete = itemDrafts
    .filter((d) => deletedItemIds.has(d.id))
    .filter((d) => !newItemFakeIds.has(d.id))
    .map((d) => d.id);
  return { toCreate, toUpdate, toDelete };
}
export type ModificationOps = ReturnType<typeof getModificationOps>;
