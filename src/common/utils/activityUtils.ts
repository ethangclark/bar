import { observable } from "mobx";
import { z } from "zod";
import {
  activityItemWithChildrenSchema,
  type ActivityItemWithChildren,
} from "~/server/db/schema";

export const createModifiedIdTracker = () => ({
  newItemFakeIds: observable.set<string>(),
  changedItemIds: observable.set<string>(),
  deletedItemIds: observable.set<string>(),
});

export const modificationOpsSchema = z.object({
  toCreate: z.array(activityItemWithChildrenSchema),
  toUpdate: z.array(activityItemWithChildrenSchema),
  toDelete: z.array(z.string()),
});
export type ModificationOps = z.infer<typeof modificationOpsSchema>;

export function getModificationOps(
  {
    newItemFakeIds,
    changedItemIds,
    deletedItemIds,
  }: ReturnType<typeof createModifiedIdTracker>,
  itemDrafts: ActivityItemWithChildren[],
): ModificationOps {
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
