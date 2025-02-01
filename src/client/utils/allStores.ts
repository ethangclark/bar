import { ActivityEditorStore } from "../activity/activityEditorStore";
import { ItemChildrenStore } from "../activity/itemChildrenStore";

const activityEditorStore = new ActivityEditorStore();
const itemChildrenStore = new ItemChildrenStore(activityEditorStore);

export const stores = {
  activityEditorStore,
  itemChildrenStore,
};

export type Stores = typeof stores;
